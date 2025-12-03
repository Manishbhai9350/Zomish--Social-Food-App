import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import ReelViewer from "../../components/ReelViewer";
import "../../App.css";
import { Axioss } from "../../utils/axios";

const THRESHOLD = 5;
const WINDOW = Math.max(2, THRESHOLD * 2);

const fetchNextReels = async (currentId = "", threshold = 1) => {
  try {
    const res = await Axioss.post("/api/food/reels", {
      params: {
        threshold: threshold,
        direction: "next",
        current: currentId,
      },
      withCredentials: true,
    });

    return res.data?.reels ?? res.data ?? [];
  } catch (error) {
    console.error("Error fetching next reels:", error);
    return [];
  }
};

const fetchPreviousReels = async (currentId = "", threshold = 1) => {
   try {
    const res = await Axioss.post("/api/food/reels", {
      params: {
        threshold: threshold,
        direction: "prev",
        current: currentId,
      },
      withCredentials: true,
    });

    return res.data?.reels ?? res.data ?? [];
  } catch (error) {
    console.error("Error fetching next reels:", error);
    return [];
  }
};

// Normalize backend reel shape to frontend shape
const mapBackendReel = (r) => {
  if (!r) return null;
  return {
    id: r._id ?? r.id ?? String(r.title ?? Math.random()),
    title: r.title ?? r.name ?? "Untitled",
    description: r.description ?? r.desc ?? "",
    url: r.video ?? r.url ?? r.src ?? "",
    partner: r.partner ?? r.owner ?? "",
    // keep original for dedupe checks if needed
    _raw: r,
  };
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialIndex = parseInt(searchParams.get("reel")) || 0;

  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(
    clamp(initialIndex, 0, reels.length - 1)
  );
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  // sensor/lock refs
  const lockRef = useRef(false);
  const wheelAccumRef = useRef(0);
  const pointerStartRef = useRef(null);
  const containerRef = useRef(null);
  const currentIndexRef = useRef(initialIndex);
  const reelsRef = useRef(reels);
  const isFetchingRef = useRef(false);
  const lastPrefetchIdRef = useRef(null);

  useEffect(() => {
    const FetchInitialReels = async () => {
      try {
        const Response = await Axioss.post("/api/food/reels", {
          withCredentials: true,
        });
        const data = Response.data;
        if (data.authorize) {
          navigate("/auth/partner/login");
        }
        // normalize backend shape — response may be array or { reels: [...] }
        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.reels)
          ? data.reels
          : [];
        const mapped = items.map(mapBackendReel).filter(Boolean);
        setReels(mapped);
      } catch (error) {
        console.error("Failed to load initial reels:", error);
      } finally {
        setLoading(false)
      }
    };

    FetchInitialReels();

    return () => {};
  }, [navigate]);

  // keep refs in sync with state so callbacks/readers get latest values
  useEffect(() => {
    currentIndexRef.current = currentIndex;
  }, [currentIndex]);

  useEffect(() => {
    reelsRef.current = reels;
  }, [reels]);

  // update URL on index change
  useEffect(() => {
    setSearchParams({ reel: currentIndex }, { replace: true });
  }, [currentIndex, setSearchParams]);

  // compute visible window
  const startIndex = Math.max(0, currentIndex - THRESHOLD);
  const endIndex = Math.min(reels.length - 1, startIndex + WINDOW - 1);

  const visible = useMemo(() => {
    const items = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (reels[i]) {
        items.push({ ...reels[i], globalIndex: i });
      }
    }
    return items;
  }, [startIndex, endIndex, reels]);

  // console.log(visible)

  // navigation with lock & prefetch (stable)
  const PAGE_DURATION = 520;
  const gotoIndex = useCallback((next) => {
    if (lockRef.current) return;
    next = clamp(next, 0, reelsRef.current.length - 1);
    if (next === currentIndexRef.current) return;

    lockRef.current = true;
    setCurrentIndex(next);
    // Smart prefetch will handle fetching based on currentIndex change
    // No need to manually call loadMoreReels here anymore

    setTimeout(() => {
      lockRef.current = false;
    }, PAGE_DURATION);
  }, []);

  // wheel sensor (use gotoIndex from callback)
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (lockRef.current) return;
      e.preventDefault();
      wheelAccumRef.current += e.deltaY;

      const SENS = 100;
      if (Math.abs(wheelAccumRef.current) >= SENS) {
        if (wheelAccumRef.current > 0) {
          gotoIndex(currentIndexRef.current + 1);
        } else {
          gotoIndex(currentIndexRef.current - 1);
        }
        wheelAccumRef.current = 0;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
    };
  }, [gotoIndex]);

  // pointer / touch swipe sensor
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onPointerDown = (e) => {
      if (lockRef.current) return;
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      pointerStartRef.current = { y, dy: 0 };
    };

    const onPointerMove = (e) => {
      if (!pointerStartRef.current || lockRef.current) return;
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      pointerStartRef.current.dy = pointerStartRef.current.y - y;
    };

    const onPointerUp = () => {
      if (!pointerStartRef.current || lockRef.current) return;
      const dy = pointerStartRef.current.dy || 0;
      const MIN_SWIPE = 80;

      if (dy > MIN_SWIPE) {
        gotoIndex(currentIndexRef.current + 1);
      } else if (dy < -MIN_SWIPE) {
        gotoIndex(currentIndexRef.current - 1);
      }

      pointerStartRef.current = null;
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("touchstart", onPointerDown, { passive: true });
    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("touchmove", onPointerMove, { passive: true });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("touchend", onPointerUp);

    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("touchend", onPointerUp);
    };
  }, [gotoIndex]);

  // keyboard navigation
  useEffect(() => {
    const onKeyDown = (e) => {
      if (lockRef.current || !["ArrowDown", "ArrowUp", " "].includes(e.key))
        return;
      e.preventDefault();

      if (e.key === "ArrowDown" || e.key === " ") {
        gotoIndex(currentIndexRef.current + 1);
      } else if (e.key === "ArrowUp") {
        gotoIndex(currentIndexRef.current - 1);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [gotoIndex]);

  // Handle reel scroll callback
  const handleReelScroll = useCallback((isActive) => {
    // Only log when reel becomes active
    if (isActive) {
      // console.log(`Currently viewing: Reel ${currentIndexRef.current + 1}`);
    }
  }, []);

  // dedupe helper for appending/prepending reels
  const mergeAndAppend = useCallback((incoming = []) => {
    if (!incoming || !incoming.length) return 0;
    const normalized = incoming.map(mapBackendReel).filter(Boolean);
    let added = 0;
    setReels((prev) => {
      const existingIds = new Set(prev.map((p) => p.id || p._id));
      const out = prev.slice();
      normalized.forEach((it) => {
        const id = it.id || it._id;
        if (!existingIds.has(id)) {
          existingIds.add(id);
          out.push(it);
          added++;
        }
      });
      return out;
    });
    return added;
  }, []);

  const mergeAndPrepend = useCallback((incoming = []) => {
    if (!incoming || !incoming.length) return 0;
    const normalized = incoming.map(mapBackendReel).filter(Boolean);
    let added = 0;
    setReels((prev) => {
      const existingIds = new Set(prev.map((p) => p.id || p._id));
      const toAdd = [];
      normalized.forEach((it) => {
        const id = it.id || it._id;
        if (!existingIds.has(id)) {
          existingIds.add(id);
          toAdd.push(it);
          added++;
        }
      });
      return [...toAdd, ...prev];
    });
    return added;
  }, []);

  // Prefetch rules: when viewing 4th reel (index 3) prefetch next using last reel id
  // and when at first reel (index 0) prefetch previous using first reel id.
  useEffect(() => {
    const smartPrefetch = async () => {
      const idx = currentIndexRef.current;
      const list = reelsRef.current || [];
      if (!list.length) return;

      // when viewing the 4th reel (index 3), prefetch next using last reel id
      if (idx === 3) {
        const last = list[list.length - 1];
        const refId = last && (last.id || last._id);
        if (!refId) return;
        const dedupeKey = `next-last-${refId}`;
        if (lastPrefetchIdRef.current === dedupeKey || isFetchingRef.current)
          return;
        lastPrefetchIdRef.current = dedupeKey;
        isFetchingRef.current = true;
        try {
          const fetched = await fetchNextReels(refId, 1);
          if (fetched && fetched.length) {
            mergeAndAppend(fetched);
          }
        } finally {
          isFetchingRef.current = false;
        }
        return;
      }

      // when at first reel, prefetch previous using first reel id
      if (idx === 0) {
        const first = list[0];
        const refId = first && (first.id || first._id);
        if (!refId) return;
        const dedupeKey = `prev-first-${refId}`;
        if (lastPrefetchIdRef.current === dedupeKey || isFetchingRef.current)
          return;
        lastPrefetchIdRef.current = dedupeKey;
        isFetchingRef.current = true;
        try {
          const fetched = await fetchPreviousReels(refId, 1);
          if (fetched && fetched.length) {
            // prepend and shift index so user remains on the same reel visually
            const added = mergeAndPrepend(fetched);
            if (added) {
              setCurrentIndex((c) => c + added);
            }
          }
        } finally {
          isFetchingRef.current = false;
        }
        return;
      }
    };

    smartPrefetch();
  }, [currentIndex, mergeAndAppend, mergeAndPrepend]);

  return (
    <div className="absolute-reel-root">
      <div ref={containerRef} className="absolute-reel-container">
        {visible.map((item) => {
          const offset = (item.globalIndex - currentIndex) * 100;
          return (
            <div
              key={`${item.id}-${item.globalIndex}`}
              className="reel"
              style={{
                position: "absolute",
                top: 0,
                left: "50%",
                transform: `translate(-50%, ${offset}vh)`,
                width: "100%",
                height: "100vh",
                transition: `transform ${PAGE_DURATION}ms cubic-bezier(.22, .9, .34, 1)`,
                willChange: "transform",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                padding: "0 16px",
                backfaceVisibility: "hidden",
              }}
              data-global-index={item.globalIndex}
            >
              <div style={{ width: "min(480px, 100%)", height: "100%" }}>
                <ReelViewer
                  reel={item}
                  isActive={item.globalIndex === currentIndex}
                  onReelScroll={handleReelScroll}
                />
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="reel-loading-indicator">Loading more reels...</div>
        )}
      </div>

      {/* Debug info */}
      <div
        style={{
          position: "fixed",
          top: 12,
          right: 12,
          background: "rgba(0,0,0,0.6)",
          color: "white",
          padding: "8px 12px",
          borderRadius: "6px",
          fontSize: "11px",
          zIndex: 999,
          pointerEvents: "none",
        }}
      >
        {currentIndex + 1} / {reels.length}
      </div>
    </div>
  );
};

export default Home;

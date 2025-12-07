import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ReelViewer from "../../components/ReelViewer";
import "../../App.css";
import { Axioss } from "../../utils/axios";
import Navbar from "../../components/Navbar";

const THRESHOLD = 5;
const WINDOW = Math.max(2, THRESHOLD * 2);

/* ----------------------------------------------------------
   FIXED: correct Axios .post usage 
----------------------------------------------------------- */
const fetchNextReels = async (currentId = "", threshold = 1) => {
  try {
    const res = await Axioss.post(
      "/api/food/reels",
      {
        threshold,
        direction: "next",
        current: currentId,
      },
      { withCredentials: true }
    );

    return res.data || [];
  } catch (error) {
    console.error("Error fetching next reels:", error);
    return [];
  }
};

const fetchPreviousReels = async (currentId = "", threshold = 1) => {
  try {
    const res = await Axioss.post(
      "/api/food/reels",
      {
        threshold,
        direction: "prev",
        current: currentId,
      },
      { withCredentials: true }
    );

    return res.data || [];
  } catch (error) {
    console.error("Error fetching previous reels:", error);
    return [];
  }
};

/* ----------------------------------------------------------
   Normalize your backend shape 
----------------------------------------------------------- */
const mapBackendReel = (r) => {
  if (!r) return null;
  return {
    id: r._id ?? r.id ?? String(r.title ?? Math.random()),
    title: r.title ?? "Untitled",
    description: r.description ?? "",
    url: r.video ?? "",
    partner: r.partner ?? "",
    _raw: r,
  };
};

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ----------------------------------------------------------
   MAIN COMPONENT
----------------------------------------------------------- */
const Home = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialIndex = parseInt(searchParams.get("reel")) || 0;

  const [reels, setReels] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(
    clamp(initialIndex, 0, reels.length - 1)
  );
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  /* refs */
  const lockRef = useRef(false);
  const wheelAccumRef = useRef(0);
  const pointerStartRef = useRef(null);
  const containerRef = useRef(null);
  const currentIndexRef = useRef(initialIndex);
  const reelsRef = useRef(reels);
  const isFetchingRef = useRef(false);
  const lastPrefetchIdRef = useRef(null);

  /* ----------------------------------------------------------
     FIX: Correct initial load request
  ----------------------------------------------------------- */
  useEffect(() => {
    const FetchInitialReels = async () => {
      try {
        const Response = await Axioss.post(
          "/api/food/reels",
          {},
          { withCredentials: true }
        );

        const data = Response.data;
        if (data.authorize) navigate("/auth/partner/login");

        const items = Array.isArray(data)
          ? data
          : Array.isArray(data?.reels)
          ? data.reels
          : [];

        const mapped = items.map(mapBackendReel).filter(Boolean);
        setReels(mapped);

        if (mapped.length) {
          await UnshiftNewReels(mapped[0].id, mapped.length);
        }
      } catch (error) {
        console.error("Failed to load initial reels:", error);
      } finally {
        setLoading(false);
      }
    };

    FetchInitialReels();
  }, [navigate]);

  /* ----------------------------------------------------------
     Append / Prepend (FIXED — correct way)
  ----------------------------------------------------------- */

  const mergeAndAppend = useCallback((incoming = []) => {
    if (!incoming.length) return 0;
    const normalized = incoming.map(mapBackendReel).filter(Boolean);
    let added = 0;

    setReels((prev) => {
      const ids = new Set(prev.map((p) => p.id));
      const out = [...prev];

      normalized.forEach((it) => {
        if (!ids.has(it.id)) {
          ids.add(it.id);
          out.push(it);
          added++;
        }
      });

      return out;
    });

    return added;
  }, []);

  const mergeAndPrepend = useCallback((incoming = []) => {
    if (!incoming.length) return 0;
    const normalized = incoming.map(mapBackendReel).filter(Boolean);
    let added = 0;

    setReels((prev) => {
      const ids = new Set(prev.map((p) => p.id));
      const add = [];

      normalized.forEach((it) => {
        if (!ids.has(it.id)) {
          ids.add(it.id);
          add.push(it);
          added++;
        }
      });

      return [...add, ...prev];
    });

    return added;
  }, []);

  /* ----------------------------------------------------------
     Fetch next / prev handlers
  ----------------------------------------------------------- */
  const AppendNewReels = async (current = "") => {
    const response = await fetchNextReels(current, 2);
    mergeAndAppend(response.reels);
  };

  const UnshiftNewReels = async (current = "") => {
    const response = await fetchPreviousReels(current, 2);
    const added = mergeAndPrepend(response.reels);
    if (added) setCurrentIndex((c) => c + added);
  };

  /* keep refs updated */
  useEffect(() => {
    currentIndexRef.current = currentIndex;
    reelsRef.current = reels;
  }, [currentIndex, reels]);

  useEffect(() => {
    setSearchParams({ reel: currentIndex }, { replace: true });
  }, [currentIndex, setSearchParams]);

  /* ----------------------------------------------------------
     Visible window (unchanged)
  ----------------------------------------------------------- */
  const startIndex = Math.max(0, currentIndex - THRESHOLD);
  const endIndex = Math.min(reels.length - 1, startIndex + WINDOW - 1);

  const visible = useMemo(() => {
    const items = [];
    for (let i = startIndex; i <= endIndex; i++) {
      if (reels[i]) items.push({ ...reels[i], globalIndex: i });
    }
    return items;
  }, [startIndex, endIndex, reels]);

  /* ----------------------------------------------------------
     Navigation logic (unchanged)
  ----------------------------------------------------------- */
  const PAGE_DURATION = 1200;

  const gotoIndex = useCallback((next) => {
    if (lockRef.current) return;

    next = clamp(next, 0, reelsRef.current.length - 1);
    if (next === currentIndexRef.current) return;

    lockRef.current = true;
    setCurrentIndex(next);

    setTimeout(() => {
      lockRef.current = false;
    }, PAGE_DURATION);
  }, []);

  /* ----------------------------------------------------------
     Wheel scroll
  ----------------------------------------------------------- */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e) => {
      if (lockRef.current) return;
      e.preventDefault();
      wheelAccumRef.current += e.deltaY;

      const SENS = 100;
      if (Math.abs(wheelAccumRef.current) >= SENS) {
        gotoIndex(
          currentIndexRef.current + (wheelAccumRef.current > 0 ? 1 : -1)
        );
        wheelAccumRef.current = 0;
      }
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [gotoIndex]);

  /* ----------------------------------------------------------
     Pointer swipe
  ----------------------------------------------------------- */
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onDown = (e) => {
      if (lockRef.current) return;
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      pointerStartRef.current = { y, dy: 0 };
    };

    const onMove = (e) => {
      if (!pointerStartRef.current || lockRef.current) return;
      const y = e.clientY ?? e.touches?.[0]?.clientY ?? 0;
      pointerStartRef.current.dy = pointerStartRef.current.y - y;
    };

    const onUp = () => {
      if (!pointerStartRef.current || lockRef.current) return;
      const dy = pointerStartRef.current.dy;
      const MIN_SWIPE = 80;

      if (dy > MIN_SWIPE) gotoIndex(currentIndexRef.current + 1);
      else if (dy < -MIN_SWIPE) gotoIndex(currentIndexRef.current - 1);

      pointerStartRef.current = null;
    };

    el.addEventListener("pointerdown", onDown);
    el.addEventListener("touchstart", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("touchend", onUp);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("touchstart", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("touchend", onUp);
    };
  }, [gotoIndex]);

  /* ----------------------------------------------------------
     Smart Prefetch (unchanged, only Axios was fixed)
  ----------------------------------------------------------- */
  useEffect(() => {
    const run = async () => {
      const idx = currentIndexRef.current;
      const list = reelsRef.current;
      if (!list.length) return;
      const len = list.length;

      // ----------------------------------
      // NEXT PREFETCH (when on second-last)
      // ----------------------------------
      if (idx === len - 2) {
        const list = reelsRef.current;
        const last = list[list.length - 1];
        const lastId = last?.id;
        if (!lastId) return;

        const key = `next-${lastId}`;
        if (lastPrefetchIdRef.current === key || isFetchingRef.current) return;

        lastPrefetchIdRef.current = key;
        isFetchingRef.current = true;

        try {
          await AppendNewReels(lastId); // <<< your correct next fetch logic
        } finally {
          isFetchingRef.current = false;
        }

        return;
      }

      if (idx === 0) {
        const first = list[0];
        const refId = first?.id;
        if (!refId) return;

        const key = `prev-${refId}`;
        if (lastPrefetchIdRef.current === key || isFetchingRef.current) return;

        lastPrefetchIdRef.current = key;
        isFetchingRef.current = true;

        try {
          const fetched = await fetchPreviousReels(refId, 1);
          const added = mergeAndPrepend(fetched);
          if (added) setCurrentIndex((c) => c + added);
        } finally {
          isFetchingRef.current = false;
        }
      }
    };

    run();
  }, [currentIndex, mergeAndAppend, mergeAndPrepend]);

  /* ----------------------------------------------------------
     JSX (unchanged)
  ----------------------------------------------------------- */
  return (
    <>
    <Navbar />
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
                justifyContent: "center"
              }}
            >
              <div style={{ width: "min(480px, 100%)", height: "100vh" }}>
                <ReelViewer
                  reel={item}
                  isActive={item.globalIndex === currentIndex}
                />
              </div>
            </div>
          );
        })}

        {loading && (
          <div className="reel-loading-indicator">Loading more reels...</div>
        )}
      </div>

      <div
        style={{
          position: "fixed",
          top: 12,
          left: 12,
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
    </>
  );
};

export default Home;

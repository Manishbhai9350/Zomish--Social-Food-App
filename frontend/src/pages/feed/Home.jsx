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



const fetchNextReels = async (currentId = '', threshold = 1) => {
  try {
    const res = await Axioss.get("/api/food/reels", {
      params: {
        threshold: threshold,
        direction: "next",
        current: currentId,
      },
      withCredentials: true
    });

    return res.data.reels || [];
  } catch (error) {
    console.error("Error fetching next reels:", error);
    return [];
  }
};

const fetchPreviousReels = async (currentId = "", threshold = 1) => {
  try {
    const res = await Axioss.get("/api/food/reels", {
      params: {
        threshold: threshold,
        direction: "prev",
        current: currentId,
      },
      withCredentials: true
    });

    return res.data.reels || [];
  } catch (error) {
    console.error("Error fetching previous reels:", error);
    return [];
  }
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
  const [hasMoreNext, setHasMoreNext] = useState(true);
  const [hasMorePrev, setHasMorePrev] = useState(false);

  const navigate = useNavigate()

  // sensor/lock refs
  const lockRef = useRef(false);
  const wheelAccumRef = useRef(0);
  const pointerStartRef = useRef(null);
  const containerRef = useRef(null);
  const lastFetchRef = useRef(0);
  const currentIndexRef = useRef(initialIndex);
  const reelsRef = useRef(reels);
  const isFetchingRef = useRef(false);
  const lastPrefetchIdRef = useRef(null); // Track last prefetch ID to prevent duplicates

  useEffect(() => {
    const GetReels = async () => {
      let Reels = []
      try {
        const reels = await Axioss.get('/api/food/reels', {
          withCredentials: true
        })

        if(reels.data.authorize === false) {
          navigate('/auth/user/login')
          return []
        }

        Reels = reels.data.reels || []
        console.log('Initial reels fetched:', Reels)

      } catch (error) {
        console.error('Error While Fetching Initial Reels:', error)
      }

      return Reels
    }

    GetReels().then((Reels) => {
      // Map backend reel shape to frontend shape
      const mappedReels = Reels.map((reel) => ({
        id: reel._id,
        title: reel.title,
        description: reel.description,
        url: reel.video,
        partner: reel.partner,
        cuisine: "Mixed",
        restaurant: "",
        rating: 4.5,
        prepTime: "20 min",
      }));
      setReels(mappedReels)
      // Check if there are more reels to fetch based on count
      // Only set hasMoreNext to true if we got EXACTLY 5 reels (threshold)
      // If we got less or more, it's the final batch or we have them all
      setHasMoreNext(mappedReels.length === 5);
      setHasMorePrev(false); // No previous reels on initial load
      setLoading(false)
    })
  
  }, [navigate])
  

  // keep refs in sync
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

  // load more reels with debounce and direction support
  // direction: 'next' (append newer) or 'prev' (prepend older)
  // refId: optional reference ID for smart prefetch
  // threshold: optional threshold (default 5 for manual scroll, 1 for smart prefetch)
  const loadMoreReels = useCallback(
    async (direction = "next", refId = null, threshold = 5) => {
      const now = Date.now();
      // Prevent multiple simultaneous fetches
      if (loading || isFetchingRef.current || now - lastFetchRef.current < 400) return;

      // For manual scroll-triggered fetches (when refId is null), check boundaries
      if (refId === null) {
        if (direction === "next") {
          // Don't fetch if no more reels available or already at end
          if (!hasMoreNext) return;
          const shouldFetch =
            reelsRef.current.length - currentIndexRef.current <= THRESHOLD + 2;
          if (!shouldFetch) return;
        } else {
          // Don't fetch if no more reels available in prev direction
          if (!hasMorePrev) return;
          // prev: fetch when currentIndex is small (close to start)
          const shouldFetch = currentIndexRef.current <= THRESHOLD + 1;
          if (!shouldFetch) return;
        }
      }

      lastFetchRef.current = now;
      isFetchingRef.current = true;
      setLoading(true);
      try {
        if (direction === "next") {
          const currentId = refId || (reelsRef.current[reelsRef.current.length - 1]?.id || '');
          console.log(`Fetching next reels with threshold ${threshold}, currentId: ${currentId}`)
          
          const more = await fetchNextReels(currentId, threshold);
          if (more.length > 0) {
            setReels((prev) => [
              ...prev,
              ...more.map((reel) => ({
                id: reel._id,
                title: reel.title,
                description: reel.description,
                url: reel.video,
                partner: reel.partner,
                cuisine: "Mixed",
                restaurant: "",
                rating: 4.5,
                prepTime: "20 min",
              }))
            ]);
            // Only set hasMoreNext to true if we got exactly threshold reels
            // If we got less, it means we got the last batch
            const hasMore = more.length === threshold;
            setHasMoreNext(hasMore);
          } else {
            // No more reels available
            setHasMoreNext(false);
          }
        } else {
          // fetch older items before the first currently loaded item
          const currentId = refId || (reelsRef.current[0]?.id || '');
          console.log(`Fetching previous reels with threshold ${threshold}, currentId: ${currentId}`)
          const prevItems = await fetchPreviousReels(currentId, threshold);
          if (prevItems.length === 0) {
            setHasMorePrev(false);
            return;
          }
          // Prepend and shift currentIndex forward by number prepended to keep same visible
          setReels((prev) => [
            ...prevItems.map((reel) => ({
              id: reel._id,
              title: reel.title,
              description: reel.description,
              url: reel.video,
              partner: reel.partner,
              cuisine: "Mixed",
              restaurant: "",
              rating: 4.5,
              prepTime: "20 min",
            })),
            ...prev
          ]);
          // Only set hasMorePrev to true if we got exactly threshold reels
          const hasMore = prevItems.length === threshold;
          setHasMorePrev(hasMore);
          setCurrentIndex((idx) => idx + prevItems.length);
        }
      } catch (err) {
        console.error("Failed to fetch reels:", err);
      } finally {
        setLoading(false);
        isFetchingRef.current = false;
      }
    },
    [loading, hasMoreNext, hasMorePrev]
  );

  // Smart bidirectional prefetch
  const smartPrefetch = useCallback(() => {
    if (loading || isFetchingRef.current) return;
    
    const currentIdx = currentIndexRef.current;
    const totalReels = reelsRef.current.length;
    
    // Case 1: If viewing second-to-last reel, fetch next using last reel's ID
    if (currentIdx === totalReels - 2 && totalReels > 1) {
      const lastReel = reelsRef.current[totalReels - 1];
      if (lastReel && hasMoreNext) {
        // Prevent duplicate prefetch requests for the same ID
        if (lastPrefetchIdRef.current === `secondlast-${lastReel.id}`) {
          return;
        }
        lastPrefetchIdRef.current = `secondlast-${lastReel.id}`;
        loadMoreReels("next", lastReel.id, 1);
      }
      return; // Exit early, don't check other cases
    }
    
    // Case 2: Always try to prefetch reel at currentIdx + 4
    const prefetchTargetIndex = currentIdx + 4;
    
    // If target reel doesn't exist, we need to fetch it
    if (prefetchTargetIndex >= totalReels) {
      // Fetch NEXT: use reel at totalReels - 1 (last reel) as reference
      const lastReel = reelsRef.current[totalReels - 1];
      if (lastReel && hasMoreNext) {
        // Prevent duplicate prefetch requests for the same ID
        if (lastPrefetchIdRef.current === `ahead-${lastReel.id}`) {
          return;
        }
        lastPrefetchIdRef.current = `ahead-${lastReel.id}`;
        loadMoreReels("next", lastReel.id, 1);
      }
      return; // Exit early
    }
    
    // Case 3: Fetch PREV when viewing reel 0 (beginning)
    if (currentIdx === 0 && hasMorePrev) {
      const firstReel = reelsRef.current[0];
      if (firstReel) {
        // Prevent duplicate prefetch requests for the same ID
        if (lastPrefetchIdRef.current === `prev-${firstReel.id}`) {
          return;
        }
        lastPrefetchIdRef.current = `prev-${firstReel.id}`;
        loadMoreReels("prev", firstReel.id, 1);
      }
    }
  }, [loading, hasMoreNext, hasMorePrev, loadMoreReels]);

  // Trigger smart prefetch when current index changes
  useEffect(() => {
    smartPrefetch();
  }, [currentIndex, smartPrefetch]);

  // navigation with lock & prefetch (stable)
  const PAGE_DURATION = 520;
  const gotoIndex = useCallback(
    (next) => {
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
    },
    []
  );

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
    if (isActive) {
      console.log(`Currently viewing: Reel ${currentIndexRef.current + 1}`);
    }
  }, []);

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

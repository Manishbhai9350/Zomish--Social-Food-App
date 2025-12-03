import React, { useState, useRef, useEffect } from "react";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { BiMessageRounded } from "react-icons/bi";
import { RiShareForwardLine } from "react-icons/ri";
import { BsArrowUpRight, BsCart3 } from "react-icons/bs";
import { MdDeliveryDining } from "react-icons/md";
import "../App.css";
import { Link } from "react-router-dom";
import { Axioss } from "../utils/axios";

const ReelViewer = ({ reel, isActive = false, onReelScroll }) => {
  const [likes, setLikes] = useState(reel._raw.like);
  const [isLiked, setIsLiked] = useState(reel._raw.hasLiked || false);
  const [expanded, setExpanded] = useState(false);
  const [loading, setLoading] = useState(false)
  const videoRef = useRef(null);

  // Handle video play/pause based on active state
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;

    // only attempt play/pause if there's a src that looks like a video
    const src = v.currentSrc || v.src || "";
    const looksLikeVideo = /\.(mp4|webm|ogg)(\?|$)/i.test(src) || /mp4|webm|ogg/i.test(src);

    if (isActive && looksLikeVideo) {
      // ensure muted so autoplay is permitted by browsers
      try {
        v.muted = true;
        v.volume = 0;
      } catch {
        // ignore
      }

      const tryPlay = async () => {
        try {
          const p = v.play();
          if (p && p.catch) {
            await p;
          }
        } catch {
          // if play is blocked, try again once the element can play
          const onCan = () => {
            v.play().catch(() => {});
            v.removeEventListener("canplay", onCan);
          };
          v.addEventListener("canplay", onCan);
        }
      };

      tryPlay();
    } else {
      try {
        v.pause();
        v.currentTime = 0;
      } catch {
        // ignore
      }
    }
  }, [isActive]);


  const handleLike = async () => {
    try {
      if(loading) return;
      setLoading(true)
      const res = await Axioss.patch('/api/food/like',{
        reel:reel.id,
      },{
        withCredentials:true
      })
      setLikes(prev => res.data.liked ? prev + 1 : prev - 1)
      setIsLiked(res.data.liked)
    } catch (error) {
      
    } finally {
      setLoading(false)
    }
  }

  // Call onReelScroll prop when active state changes
  const stableReelId = reel?.id ?? String(reel?.title ?? "unknown");
  useEffect(() => {
    if (onReelScroll) {
      onReelScroll(isActive, stableReelId);
    }
  }, [isActive, stableReelId, onReelScroll]);


  // prefer backend description when available
  const fullDescription = reel?.description
    ? reel.description
    : `${reel.title} is an amazing dish prepared with fresh, premium ingredients. Savor the perfect blend of spices and flavors. Order now and get 20% off on your first order! 🎉`;
  const maxLength = 60;
  const isLong = fullDescription.length > maxLength;
  const displayText = expanded
    ? fullDescription
    : fullDescription.slice(0, maxLength);

  return (
    <div className="reel-viewer">
      <div className="reel-media">
        {/* only set src when it looks like a playable video to avoid media errors */}
        <video
          ref={videoRef}
          style={{ height: "100%", width: "100%", objectFit: "cover" }}
          muted
          loop
          playsInline
          preload="metadata"
          src={/\.(mp4|webm|ogg)(\?|$)/i.test(reel?.url || "") || /mp4|webm|ogg/i.test(reel?.url || "") ? reel.url : undefined}
          aria-label={reel.title}
        />
        {/* If the url doesn't look like a video, we could render a poster or placeholder here. */}
      </div>

      <div className="reel-overlay"></div>

      <div className="reel-content">
        <div className="reel-info">
          <div
            style={{
              display: "flex",
              paddingRight: 5,
              justifyContent: "space-between",
              alignItems: "center",
              minHeight: 100,
              width: "100%",
            }}
            className="info-header"
          >
            <div className="info-header-titles">
              <h1 className="reel-title">{reel.title}</h1>
              <Link to={`/food-partner/${reel.partner}`}>
                <div style={{ marginTop: 10 }}>
                  <span
                    style={{
                      background: "rgba(53, 171, 255, 0.85)",
                      padding: "6px 16px",
                      borderRadius: "12px",
                      fontSize: "15px",
                      fontWeight: "600",
                      letterSpacing: "0.5px",
                      textTransform: "uppercase",
                      whiteSpace: "nowrap",
                    }}
                  >
                    Visit {" "}
                    <BsArrowUpRight size={15} fontWeight={700} />
                  </span>
                </div>
              </Link>
            </div>
            <div className="content-like">
              <button
                className={`reel-like-btn ${isLiked ? "liked" : ""}`}
                onClick={handleLike}
                title="Like"
              >
                <div className="reel-like-icon">
                  {isLiked ? (
                    <AiFillHeart size={28} />
                  ) : (
                    <AiOutlineHeart size={28} />
                  )}
                </div>
                <span className="like-count">
                  {likes > 999 ? `${(likes / 1000).toFixed(1)}k` : likes}
                </span>
              </button>
            </div>
          </div>

          {/* Description with See More / See Less */}
          <div>
            <p
              style={{
                margin: 0,
                fontSize: "13px",
                lineHeight: "1.4",
                color: "rgba(255, 255, 255, 0.85)",
                letterSpacing: "0.2px",
              }}
            >
              {displayText}
              {isLong && !expanded && "..."}
            </p>
            {isLong && (
              <button
                onClick={() => setExpanded(!expanded)}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(255, 255, 255, 0.9)",
                  fontSize: "12px",
                  fontWeight: "600",
                  cursor: "pointer",
                  padding: "4px 0",
                  marginTop: "6px",
                  transition: "all 0.2s ease",
                  textDecoration: "underline",
                }}
                onMouseEnter={(e) =>
                  (e.target.style.color = "rgba(255, 255, 255, 1)")
                }
                onMouseLeave={(e) =>
                  (e.target.style.color = "rgba(255, 255, 255, 0.9)")
                }
              >
                {expanded ? "See Less" : "See More"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReelViewer;

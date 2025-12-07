import React, { useState, useRef, useEffect, useMemo } from "react";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { BsFillSaveFill, BsSave, BsArrowUpRight } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import { Axioss } from "../utils/axios";

const ReelViewer = ({ reel, isOpen, onLike = (reelId='') => {}, onSave = (reelId='') => {} }) => {
  const [expanded, setExpanded] = useState(false);
  const videoRef = useRef(null);
  const progressRef = useRef(null);

  const navigate = useNavigate();


  useEffect(() => {
    const v = videoRef.current;
    if (!v || !isOpen) return;

    try {
      v.muted = true;
      v.volume = 0;
      v.play().catch(() => {});
    } catch {}


    return () => {
      try {
        v.pause();
        v.currentTime = 0;
      } catch {}
    };
  }, [isOpen]);

  const likes = useMemo(() => reel.likes?.length || 0,[reel])

  const fullDescription = reel.description || "";
  const maxLength = 100;
  const isLong = fullDescription.length > maxLength;
  const displayText = expanded
    ? fullDescription
    : fullDescription.slice(0, maxLength);

  if (!isOpen) return null;

  return (
    <div style={{aspectRatio:16/9,height:'100vh'}} className="reel-viewer">
      {/* ---------- VIDEO ---------- */}
      <div className="reel-media">
        <video
          ref={videoRef}
          style={{ height: "100%", width: "100%", objectFit: "cover" }}
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={reel.title}
          src={
            /\.(mp4|webm|ogg)(\?|$)/i.test(reel?.video || "") ||
            /mp4|webm|ogg/i.test(reel?.video || "")
              ? reel.video
              : undefined
          }
        />
      </div>

      {/* DARK OVERLAY */}
      <div className="reel-overlay"></div>

      {/* ---------- CONTENT ---------- */}
      <div className="reel-content">
        <div className="reel-info">
          <div
            style={{
              display: "flex",
              paddingRight: 5,
              justifyContent: "space-between",
              alignItems: "flex-end",
              minHeight: 100,
              width: "100%",
              marginBottom: 20,
            }}
            className="info-header"
          >
            {/* TITLE + VISIT BUTTON */}
            <div className="info-header-titles">
              <h1 className="reel-title">{reel.title}</h1>

              {/* <Link to={`/food-partner/${reel.partner}`}>
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
                    Visit <BsArrowUpRight size={15} />
                  </span>
                </div>
              </Link> */}
            </div>

            {/* LIKE + SAVE BUTTONS */}
            <div className="content-buttons">
              <button
                className={`reel-like-btn ${reel.isLiked ? "liked" : ""}`}
                onClick={() => onLike(reel._id)}
                title="Like"
              >
                <div className="reel-like-icon">
                  {reel.hasLiked ? (
                    <AiFillHeart size={28} />
                  ) : (
                    <AiOutlineHeart size={28} />
                  )}
                </div>
                <span className="like-count">
                  {likes  > 999 ? `${(likes / 1000).toFixed(1)}k` : likes}
                </span>
              </button>

              <button
                className={`reel-save-btn ${reel.hasSaved ? "saved" : ""}`}
                onClick={() => onSave(reel._id)}
                title="Save"
              >
                <div className="reel-like-icon">
                  {reel.hasSaved ? (
                    <BsFillSaveFill size={28} />
                  ) : (
                    <BsSave size={28} />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* ---------- DESCRIPTION ---------- */}
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
                  textDecoration: "underline",
                }}
              >
                {expanded ? "See Less" : "See More"}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ---------- PROGRESS BAR ---------- */}
      <div className="progress">
        <div ref={progressRef} className="line"></div>
      </div>
    </div>
  );
};

export default ReelViewer;

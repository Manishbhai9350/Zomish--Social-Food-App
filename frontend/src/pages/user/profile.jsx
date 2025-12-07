import React, { useEffect, useMemo, useState } from "react";
import { AiOutlineHeart, AiFillHeart } from "react-icons/ai";
import { BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { IoArrowBack } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import "../../App.css";
import { useSelector } from "react-redux";
import { Axioss } from "../../utils/axios";
import Reel from "../../components/Reel";

const UserProfile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("liked");

  const user = useSelector((state) => state.user);

  const [savedReels, setSavedReels] = useState([]);
  const [likedReels, setLikedReels] = useState([]);
  const [openIndex, setOpenIndex] = useState(null); // universal index

  useEffect(() => {
    const GetData = async () => {
      try {
        const Res = await Axioss.get("/api/user/reels", {
          withCredentials: true,
        });
        const { savedReels, likedReels } = Res.data;
        setSavedReels(savedReels);
        setLikedReels(likedReels);
      } catch (error) {}
    };
    GetData();
  }, []);


  async function ToggleReelLike(reelId = "") {
    if (!reelId) return;

    const res = await Axioss.patch(
      "/api/food/like",
      { reel: reelId },
      { withCredentials: true }
    ).catch(() => {});

    if (!res) return;

    const { liked, reel } = res.data;

    // --- Update likedReels ---
    setLikedReels((prev) => {

      const exists = prev.some((r) => r._id === reelId);

      if (liked) {
        if (!exists) {
          return [
            { ...reel,hasLiked:liked},
            ...prev,
          ];
        } else {
          return prev.map((r) =>
            r._id === reelId
              ? { ...r,hasLiked:liked }
              : r
          );
        }
      } else {
        // UNLIKE → remove from liked list
        return prev.filter((r) => r._id !== reelId);
      }
    });

    // --- Sync savedReels.hasLiked & savedReels.likes ---
    setSavedReels((prev) =>
      prev.map((r) => {
        return r._id == reel._id
          ? { ...r, hasLiked:liked, likes:reel.likes }
          : r;
      })
    );
  }

  async function ToggleReelSave(reelId = "") {
    if (!reelId) return;

    const res = await Axioss.patch(
      "/api/food/save",
      { reel: reelId },
      { withCredentials: true }
    ).catch(() => {});

    if (!res) return;

    const { saved, reel, liked } = res.data;

    // --- Update savedReels ---
    setSavedReels((prev) => {
      const exists = prev.some((r) => r._id === reelId);

      if (saved) {
        // SAVE
        if (!exists) {
          return [{ ...reel, hasSaved: true, hasLiked:liked }, ...prev];
        } else {
          return prev.map((r) =>
            r._id === reelId ? { ...r, hasSaved: true, hasLiked:liked } : r
          );
        }
      } else {
        // UNSAVE → remove from saved list
        return prev.filter((r) => r._id !== reelId);
      }
    });

    // --- Sync likedReels.hasSaved ---
    setLikedReels((prev) =>
      prev.map((r) =>
        r._id === reelId
          ? { ...r, hasSaved: saved, likes: reel.likes }
          : r
      )
    );
  }

  const reelsToShow = useMemo(() => activeTab == 'liked' ? likedReels : savedReels, [likedReels,savedReels,activeTab])


  return (
    <div className="partner-page">
      {/* Header */}
      <div className="partner-header">
        <button onClick={() => navigate(-1)} className="partner-back-btn">
          <IoArrowBack size={24} />
        </button>
        <h1 className="partner-page-title">My Profile</h1>
      </div>

      {/* Profile Card */}
      <div className="user-info-card" style={{ marginTop: "20px" }}>
        <div className="user-avatar">
          {user?.fullname?.charAt(0).toUpperCase()}
        </div>
        <div className="user-info">
          <h1 className="fullname">{user?.fullname}</h1>
          <p className="email">{user?.email}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="profile-tabs">
        <button
          onClick={() => setActiveTab("liked")}
          className={`profile-tab ${activeTab === "liked" ? "active" : ""}`}
        >
          ❤️ Liked Reels {likedReels?.length || 0}
        </button>
        <button
          onClick={() => setActiveTab("saved")}
          className={`profile-tab ${activeTab === "saved" ? "active" : ""}`}
        >
          📌 Saved Reels {savedReels?.length || 0}
        </button>
      </div>

      {/* Reels Grid */}
      <div className="partner-reels-section" style={{ marginTop: "10px" }}>
        <h3 className="section-title">
          {activeTab === "liked" ? "Liked Reels" : "Saved Reels"}
        </h3>

        <div className="partner-reels-grid">
          {reelsToShow.map((reel, i) => (
            <div
              key={reel._id}
              className="reel-card"
              onClick={() => setOpenIndex(i)}
              style={{ cursor: "pointer" }}
            >
              <video
                src={reel.video}
                style={{
                  width: "100%",
                  height: "150px",
                  objectFit: "cover",
                }}
                muted
                loop
                preload="metadata"
              />
              <div className="reel-card-info" style={{ marginTop: "6px" }}>
                <h4 className="reel-card-title">{reel.title}</h4>
                {/* <p className="reel-card-description">
                  {reel.description.length > 10
                    ? reel.description.slice(0, 10) + "..."
                    : reel.description}
                </p> */}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Empty State */}
      {!reelsToShow.length && (
        <div
          className="empty-state"
          style={{ marginTop: "20px", textAlign: "center" }}
        >
          <p>No {activeTab} reels found</p>
        </div>
      )}

      {/* Popup Modal for ReelViewer */}
      {openIndex !== null && (
        <div
          className="reel-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "400px",
              maxHeight: "100vh",
              position: "relative",
            }}
          >
            {/* Close Button */}
            <button
              onClick={() => setOpenIndex(null)}
              style={{
                position: "absolute",
                top: "10px",
                right: "10px",
                background: "rgba(0,0,0,0.6)",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "36px",
                height: "36px",
                fontSize: "20px",
                cursor: "pointer",
                zIndex: 10,
              }}
            >
              ✕
            </button>

            {/* Render all reels but only open the selected one */}
            {reelsToShow.map((reel, i) => (
              <Reel
                key={reel._id}
                onLike={ToggleReelLike}
                onSave={ToggleReelSave}
                reel={reel}
                isOpen={i === openIndex}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;

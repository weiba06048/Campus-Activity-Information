// 活动详情页最下方的评论区：发表、查看、删除自己的评论
// 评论保存在本机浏览器（localStorage），刷新或重新打开后仍然在

import { useState } from "react";
import { ChatCircle, PaperPlaneRight, Trash } from "@phosphor-icons/react";
import { useData } from "./store.jsx";
import { DEFAULT_NICKNAME, formatCommentTime } from "./storage.js";

export function Comments({ activityId }) {
  const { commentsOf, addComment, removeComment, profile, updateNickname } = useData();
  const list = commentsOf(activityId);
  const [nickname, setNickname] = useState(profile.nickname || DEFAULT_NICKNAME);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [posted, setPosted] = useState(false);

  const submit = (event) => {
    event.preventDefault();
    const text = content.trim();
    if (!text) {
      setError("先写点内容再发表");
      return;
    }
    if (text.length > 400) {
      setError("评论最多 400 字");
      return;
    }
    const finalName = nickname.trim() || DEFAULT_NICKNAME;
    updateNickname(finalName);
    addComment(activityId, text, finalName);
    setContent("");
    setError("");
    setPosted(true);
  };

  const onDelete = (commentId) => {
    if (window.confirm("删除这条评论？删除后无法恢复。")) removeComment(commentId);
  };

  return (
    <section className="detail-section comments">
      <h2 className="detail-section-title">
        <ChatCircle size={17} weight="bold" className="inline-icon" />
        讨论区
        <span className="comments-count">{list.length ? `${list.length} 条` : "还没有人发言"}</span>
      </h2>

      <form className="comment-form" onSubmit={submit}>
        <div className="comment-form-row">
          <label className="comment-nickname">
            <span>昵称</span>
            <input
              type="text"
              value={nickname}
              maxLength={16}
              placeholder={DEFAULT_NICKNAME}
              onChange={(event) => setNickname(event.target.value)}
            />
          </label>
          <span className="comment-hint">昵称会记住，下次评论自动填上</span>
        </div>
        <textarea
          className="comment-input"
          rows={3}
          value={content}
          maxLength={400}
          placeholder="说说你对这场活动的疑问或想法，比如「需要自己带电脑吗？」"
          onChange={(event) => {
            setContent(event.target.value);
            setError("");
            setPosted(false);
          }}
        />
        <div className="comment-actions">
          <span className={`comment-status ${error ? "is-error" : ""}`}>
            {error || (posted ? "已发表，刷新页面后仍然保留" : "")}
          </span>
          <span className="comment-counter">{content.length}/400</span>
          <button type="submit" className="primary-button" disabled={!content.trim()}>
            <PaperPlaneRight size={15} weight="bold" />
            发表评论
          </button>
        </div>
      </form>

      {list.length ? (
        <ul className="comment-list">
          {list.map((comment) => (
            <li className="comment-item" key={comment.id}>
              <div className="comment-head">
                <span className="comment-author">{comment.author}</span>
                {comment.mine ? <span className="comment-mine">我</span> : null}
                <span className="comment-time">{formatCommentTime(comment.createdAt)}</span>
                {comment.mine ? (
                  <button
                    type="button"
                    className="comment-delete"
                    onClick={() => onDelete(comment.id)}
                    aria-label="删除这条评论"
                  >
                    <Trash size={14} weight="bold" />
                  </button>
                ) : null}
              </div>
              <p className="comment-content">{comment.content}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="comment-empty">还没有评论，来问第一个问题吧。</p>
      )}
    </section>
  );
}

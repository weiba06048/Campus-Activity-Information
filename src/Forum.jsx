// 校园论坛：讨论活动安排、提建议、直接提问
// 帖子与回复都保存在本机浏览器（localStorage），刷新或重新打开后还在

import { useMemo, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChatCircleDots,
  ChatTeardropText,
  Lightbulb,
  PaperPlaneRight,
  Plus,
  Question,
  Trash,
  Users,
} from "@phosphor-icons/react";
import { useData } from "./store.jsx";
import { DEFAULT_NICKNAME, createId, formatCommentTime } from "./storage.js";

const TOPIC_TYPES = [
  { id: "discuss", name: "讨论安排", hint: "约时间、商量活动怎么组织", Icon: Users },
  { id: "suggest", name: "提建议", hint: "对活动或组织方式的建议", Icon: Lightbulb },
  { id: "ask", name: "提问求助", hint: "有疑问、想找人帮忙", Icon: Question },
];

const TOPIC_BY_ID = Object.fromEntries(TOPIC_TYPES.map((item) => [item.id, item]));

const TITLE_LIMIT = 40;
const CONTENT_LIMIT = 600;
const REPLY_LIMIT = 400;

function TopicTag({ type }) {
  const topic = TOPIC_BY_ID[type] || TOPIC_TYPES[0];
  return (
    <span className={`topic-tag topic-${topic.id}`}>
      <topic.Icon size={13} weight="bold" />
      {topic.name}
    </span>
  );
}

function excerpt(text, limit = 70) {
  const plain = (text || "").replace(/\s+/g, " ").trim();
  return plain.length > limit ? `${plain.slice(0, limit)}…` : plain;
}

// ---------------------------------------------------------------- 发帖

function ComposeForm() {
  const { profile, updateNickname, saveThread } = useData();
  const [nickname, setNickname] = useState(profile.nickname || DEFAULT_NICKNAME);
  const [type, setType] = useState(TOPIC_TYPES[0].id);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  const submit = (event) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    const cleanContent = content.trim();
    if (!cleanTitle) {
      setError("先写个标题，方便其他同学一眼看懂在聊什么");
      return;
    }
    if (!cleanContent) {
      setError("正文还空着，写清楚想讨论或想问的内容");
      return;
    }
    const finalName = nickname.trim() || DEFAULT_NICKNAME;
    updateNickname(finalName);
    const thread = {
      id: createId("topic"),
      type,
      title: cleanTitle,
      content: cleanContent,
      author: finalName,
      createdAt: new Date().toISOString(),
      mine: true,
      replies: [],
    };
    saveThread(thread);
    window.location.hash = `#/forum/t/${thread.id}`;
  };

  return (
    <form className="forum-compose" onSubmit={submit}>
      <div className="forum-compose-head">
        <Plus size={16} weight="bold" />
        <span>发一个新帖</span>
      </div>

      <div className="forum-type-picker" role="group" aria-label="选择帖子类型">
        {TOPIC_TYPES.map((topic) => (
          <button
            type="button"
            key={topic.id}
            className={`type-chip ${type === topic.id ? "is-active" : ""}`}
            aria-pressed={type === topic.id}
            onClick={() => setType(topic.id)}
          >
            <topic.Icon size={14} weight="bold" />
            <span className="type-chip-text">
              <b>{topic.name}</b>
              <i>{topic.hint}</i>
            </span>
          </button>
        ))}
      </div>

      <label className="field">
        <span>
          标题 <b className="required">必填</b>
        </span>
        <input
          type="text"
          value={title}
          maxLength={TITLE_LIMIT}
          placeholder="例如：周末桌游局能不能改到下午？"
          onChange={(event) => {
            setTitle(event.target.value);
            setError("");
          }}
        />
      </label>

      <label className="field">
        <span>
          正文 <b className="required">必填</b>
        </span>
        <textarea
          rows={4}
          value={content}
          maxLength={CONTENT_LIMIT}
          placeholder="把背景和你的想法写清楚，其他同学才好接话"
          onChange={(event) => {
            setContent(event.target.value);
            setError("");
          }}
        />
      </label>

      <div className="forum-compose-foot">
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
        <span className={`forum-status ${error ? "is-error" : ""}`}>{error}</span>
        <button type="submit" className="primary-button" disabled={!title.trim() || !content.trim()}>
          <PaperPlaneRight size={15} weight="bold" />
          发布帖子
        </button>
      </div>
    </form>
  );
}

// ---------------------------------------------------------------- 帖子列表

export function ForumPage() {
  const { threads } = useData();
  const [filter, setFilter] = useState("all");

  const counts = useMemo(() => {
    const map = { all: threads.length };
    TOPIC_TYPES.forEach((topic) => {
      map[topic.id] = threads.filter((item) => item.type === topic.id).length;
    });
    return map;
  }, [threads]);

  const visible = useMemo(
    () => (filter === "all" ? threads : threads.filter((item) => item.type === filter)),
    [threads, filter],
  );

  return (
    <div className="page forum-page">
      <header className="forum-head">
        <h1 className="forum-title">校园论坛</h1>
        <p className="forum-subtitle">
          活动时间怎么安排、对组织方式有建议、或者只是想问一句，都可以在这里发帖。内容保存在本机浏览器，刷新或重新打开后还在。
        </p>
      </header>

      <ComposeForm />

      <section className="forum-list-section">
        <div className="forum-list-head">
          <div className="forum-filter" role="group" aria-label="按类型筛选帖子">
            <button
              type="button"
              className={`filter-chip ${filter === "all" ? "is-active" : ""}`}
              aria-pressed={filter === "all"}
              onClick={() => setFilter("all")}
            >
              全部 <i>{counts.all}</i>
            </button>
            {TOPIC_TYPES.map((topic) => (
              <button
                type="button"
                key={topic.id}
                className={`filter-chip ${filter === topic.id ? "is-active" : ""}`}
                aria-pressed={filter === topic.id}
                onClick={() => setFilter(topic.id)}
              >
                {topic.name} <i>{counts[topic.id]}</i>
              </button>
            ))}
          </div>
          <span className="forum-sort-hint">按最新回复排序</span>
        </div>

        {visible.length ? (
          <ul className="thread-list">
            {visible.map((thread) => (
              <li key={thread.id}>
                <button type="button" className="thread-item" onClick={() => navigateThread(thread.id)}>
                  <span className="thread-main">
                    <span className="thread-title-row">
                      <TopicTag type={thread.type} />
                      <span className="thread-title">{thread.title}</span>
                    </span>
                    <span className="thread-excerpt">{excerpt(thread.content)}</span>
                    <span className="thread-foot">
                      <span className="thread-author">{thread.author}</span>
                      <span className="thread-time">{formatCommentTime(thread.createdAt)}</span>
                      <span className="thread-replies">
                        <ChatTeardropText size={13} weight="bold" />
                        {thread.replies.length ? `${thread.replies.length} 条回复` : "暂无回复"}
                      </span>
                      {thread.mine ? <span className="thread-mine">我发布的</span> : null}
                    </span>
                  </span>
                  <ArrowRight size={16} weight="bold" className="thread-arrow" />
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <div className="empty-state">
            <ChatCircleDots size={22} weight="bold" />
            <p className="empty-title">{threads.length ? "这个分类下还没有帖子" : "论坛里还没有帖子"}</p>
            <p className="empty-hint">
              {threads.length
                ? "换个分类看看，或者在上面的表单里发一条。"
                : "活动想改时间、对组织方式有想法、找不到人一起参加，都可以发第一条。"}
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

function navigateThread(threadId) {
  window.location.hash = `#/forum/t/${threadId}`;
}

// ---------------------------------------------------------------- 帖子详情

export function ThreadPage({ threadId }) {
  const { threadById, removeThread, addReply, removeReply, profile, updateNickname } = useData();
  const thread = threadById[threadId];
  const [nickname, setNickname] = useState(profile.nickname || DEFAULT_NICKNAME);
  const [content, setContent] = useState("");
  const [error, setError] = useState("");

  if (!thread) {
    return (
      <div className="page">
        <button type="button" className="back-link" onClick={() => { window.location.hash = "#/forum"; }}>
          <ArrowLeft size={15} weight="bold" />
          返回论坛
        </button>
        <div className="empty-state">
          <ChatCircleDots size={22} weight="bold" />
          <p className="empty-title">找不到这个帖子</p>
          <p className="empty-hint">它可能已经被删除，或者只存在于发帖的那台设备上。</p>
        </div>
      </div>
    );
  }

  const submitReply = (event) => {
    event.preventDefault();
    const text = content.trim();
    if (!text) {
      setError("先写点内容再回复");
      return;
    }
    const finalName = nickname.trim() || DEFAULT_NICKNAME;
    updateNickname(finalName);
    addReply(thread.id, text, finalName);
    setContent("");
    setError("");
  };

  const onDeleteThread = () => {
    if (!window.confirm("删除这个帖子？帖子和下面的回复都会一起删掉。")) return;
    removeThread(thread.id);
    window.location.hash = "#/forum";
  };

  const onDeleteReply = (replyId) => {
    if (window.confirm("删除这条回复？删除后无法恢复。")) removeReply(thread.id, replyId);
  };

  return (
    <div className="page forum-page">
      <button type="button" className="back-link" onClick={() => window.location.hash = "#/forum"}>
        <ArrowLeft size={15} weight="bold" />
        返回论坛
      </button>

      <article className="thread-detail">
        <div className="thread-detail-head">
          <TopicTag type={thread.type} />
          {thread.mine ? <span className="thread-mine">我发布的</span> : null}
          <span className="thread-detail-time">{formatCommentTime(thread.createdAt)}</span>
        </div>
        <h1 className="thread-detail-title">{thread.title}</h1>
        <p className="thread-detail-author">楼主 · {thread.author}</p>
        <p className="thread-detail-content">{thread.content}</p>
        {thread.mine ? (
          <div className="thread-detail-actions">
            <button type="button" className="danger-button" onClick={onDeleteThread}>
              <Trash size={15} weight="bold" />
              删除这个帖子
            </button>
          </div>
        ) : null}
      </article>

      <section className="detail-section replies">
        <h2 className="detail-section-title">
          <ChatTeardropText size={17} weight="bold" className="inline-icon" />
          回复
          <span className="comments-count">
            {thread.replies.length ? `${thread.replies.length} 条` : "还没有人回复"}
          </span>
        </h2>

        {thread.replies.length ? (
          <ul className="comment-list">
            {thread.replies.map((reply) => (
              <li className="comment-item" key={reply.id}>
                <div className="comment-head">
                  <span className="comment-author">{reply.author}</span>
                  {reply.mine ? <span className="comment-mine">我</span> : null}
                  <span className="comment-time">{formatCommentTime(reply.createdAt)}</span>
                  {reply.mine ? (
                    <button
                      type="button"
                      className="comment-delete"
                      onClick={() => onDeleteReply(reply.id)}
                      aria-label="删除这条回复"
                    >
                      <Trash size={14} weight="bold" />
                    </button>
                  ) : null}
                </div>
                <p className="comment-content">{reply.content}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="comment-empty">还没有人回复，来说说你的想法。</p>
        )}

        <form className="comment-form reply-form" onSubmit={submitReply}>
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
            <span className="comment-hint">昵称会记住，下次回复自动填上</span>
          </div>
          <textarea
            className="comment-input"
            rows={3}
            value={content}
            maxLength={REPLY_LIMIT}
            placeholder="回复这个帖子，或者补充你知道的信息"
            onChange={(event) => {
              setContent(event.target.value);
              setError("");
            }}
          />
          <div className="comment-actions">
            <span className={`comment-status ${error ? "is-error" : ""}`}>{error}</span>
            <span className="comment-counter">
              {content.length}/{REPLY_LIMIT}
            </span>
            <button type="submit" className="primary-button" disabled={!content.trim()}>
              <PaperPlaneRight size={15} weight="bold" />
              发表回复
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

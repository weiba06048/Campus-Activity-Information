import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  Basketball,
  Briefcase,
  Buildings,
  CalendarBlank,
  CaretRight,
  CheckCircle,
  Clock,
  EnvelopeSimple,
  Flask,
  HandHeart,
  Info,
  Lightbulb,
  MagnifyingGlass,
  MapPin,
  Megaphone,
  MicrophoneStage,
  Presentation,
  SealCheck,
  Sparkle,
  Tag,
  Ticket,
  Trophy,
  Users,
  UsersThree,
  Wrench,
  X,
} from "@phosphor-icons/react";
import {
  ACTIVITIES,
  ACTIVITY_BY_ID,
  CATEGORIES,
  CATEGORY_BY_ID,
  activitiesOfCategory,
  categoryOf,
  searchActivities,
} from "./data/activities.js";

// 板块图标映射：数据里写图标名，这里换成真正的图标组件
const ICONS = {
  Trophy,
  Presentation,
  MicrophoneStage,
  Basketball,
  HandHeart,
  UsersThree,
  Briefcase,
  Lightbulb,
  Flask,
  Wrench,
};

const STATUS_STYLE = {
  报名中: { className: "status-open", dot: "#16a34a" },
  即将开始: { className: "status-soon", dot: "#2563eb" },
  进行中: { className: "status-live", dot: "#d97706" },
  已结束: { className: "status-closed", dot: "#9ca3af" },
  长期开放: { className: "status-longterm", dot: "#7c3aed" },
};

const STATUS_ORDER = ["报名中", "即将开始", "进行中", "长期开放", "已结束"];

// ---------------------------------------------------------------- 路由（用地址栏 hash，方便直接分享某场活动）

function parseRoute(hash) {
  const raw = (hash || "").replace(/^#/, "") || "/";
  const [path, queryString] = raw.split("?");
  const params = new URLSearchParams(queryString || "");
  const segments = path.split("/").filter(Boolean);
  if (segments[0] === "c" && segments[1]) return { name: "category", categoryId: segments[1] };
  if (segments[0] === "a" && segments[1]) return { name: "activity", activityId: segments[1] };
  if (segments[0] === "search") return { name: "search", keyword: params.get("q") || "" };
  return { name: "home" };
}

function navigate(to) {
  if (window.location.hash === to) return;
  window.location.hash = to;
}

function useRoute() {
  const [route, setRoute] = useState(() => parseRoute(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseRoute(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  return route;
}

function useScrollTopOnRouteChange(key) {
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [key]);
}

// ---------------------------------------------------------------- 小工具

// 日期块根据 dateKind 分成三种形态：活动日期 / 报名截止日 / 长期开放
function dateParts(activity) {
  if (activity.dateKind === "open" || !activity.startDate) return { kind: "open" };
  const [, month, day] = activity.startDate.split("-");
  return {
    kind: activity.dateKind === "deadline" ? "deadline" : "event",
    month: `${Number(month)} 月`,
    day: String(Number(day)),
  };
}

function TrustBadge({ trust }) {
  if (!trust) return null;
  return <span className="trust-badge">{trust}</span>;
}

function Highlight({ text, keyword }) {
  const query = (keyword || "").trim();
  if (!query) return text;
  const lower = text.toLowerCase();
  const target = query.toLowerCase();
  const parts = [];
  let cursor = 0;
  let index = lower.indexOf(target);
  while (index !== -1) {
    parts.push(text.slice(cursor, index));
    parts.push(<mark key={`${index}-${parts.length}`}>{text.slice(index, index + target.length)}</mark>);
    cursor = index + target.length;
    index = lower.indexOf(target, cursor);
  }
  parts.push(text.slice(cursor));
  return parts;
}

function StatusPill({ status }) {
  const style = STATUS_STYLE[status] || STATUS_STYLE["已结束"];
  return (
    <span className={`status-pill ${style.className}`}>
      <span className="status-dot" style={{ background: style.dot }} />
      {status}
    </span>
  );
}

function CategoryIcon({ name, size = 22 }) {
  const Icon = ICONS[name] || Tag;
  return <Icon size={size} weight="bold" />;
}

function EmptyState({ title, hint }) {
  return (
    <div className="empty-state">
      <Info size={22} weight="bold" />
      <p className="empty-title">{title}</p>
      {hint ? <p className="empty-hint">{hint}</p> : null}
    </div>
  );
}

// ---------------------------------------------------------------- 右上角搜索框

function SearchBox({ route }) {
  const [value, setValue] = useState(route.name === "search" ? route.keyword : "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const boxRef = useRef(null);

  const results = useMemo(() => (value.trim() ? searchActivities(value) : []), [value]);
  const visibleResults = results.slice(0, 6);
  const hotKeywords = useMemo(() => {
    const counter = new Map();
    for (const activity of ACTIVITIES) {
      for (const tag of activity.tags) counter.set(tag, (counter.get(tag) || 0) + 1);
    }
    return [...counter.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([tag]) => tag);
  }, []);

  useEffect(() => {
    const onPointerDown = (event) => {
      if (boxRef.current && !boxRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, []);

  useEffect(() => {
    setActiveIndex(-1);
  }, [value]);

  const gotoActivity = (activity) => {
    setOpen(false);
    navigate(`#/a/${activity.id}`);
  };

  const submit = (keyword = value) => {
    const query = keyword.trim();
    if (!query) return;
    if (activeIndex >= 0 && visibleResults[activeIndex]) {
      gotoActivity(visibleResults[activeIndex]);
      return;
    }
    setOpen(false);
    navigate(`#/search?q=${encodeURIComponent(query)}`);
  };

  const onKeyDown = (event) => {
    if (event.key === "Escape") {
      setOpen(false);
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setOpen(true);
      setActiveIndex((index) => Math.min(index + 1, visibleResults.length - 1));
      return;
    }
    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => Math.max(index - 1, -1));
      return;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  };

  const showPanel = open && (value.trim() || hotKeywords.length > 0);

  return (
    <div className="search" ref={boxRef}>
      <div className="search-field">
        <MagnifyingGlass size={17} weight="bold" className="search-icon" />
        <input
          type="search"
          value={value}
          placeholder="搜索活动、比赛、社团…"
          aria-label="搜索校园活动"
          onChange={(event) => {
            setValue(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {value ? (
          <button type="button" className="search-clear" aria-label="清空搜索" onClick={() => setValue("")}>
            <X size={14} weight="bold" />
          </button>
        ) : null}
      </div>

      {showPanel ? (
        <div className="search-panel">
          {value.trim() ? (
            visibleResults.length ? (
              <>
                <p className="panel-label">
                  找到 {results.length} 场相关活动
                </p>
                <ul className="panel-list">
                  {visibleResults.map((activity, index) => {
                    const category = categoryOf(activity);
                    const parts = dateParts(activity);
                    return (
                      <li key={activity.id}>
                        <button
                          type="button"
                          className={`panel-item ${index === activeIndex ? "is-active" : ""}`}
                          onMouseEnter={() => setActiveIndex(index)}
                          onClick={() => gotoActivity(activity)}
                        >
                          <span className={`panel-date ${parts.kind === "open" ? "is-open" : ""}`}>
                            {parts.kind === "open" ? (
                              <b>长期</b>
                            ) : (
                              <>
                                {parts.kind === "deadline" ? "截止" : parts.month}
                                <b>{parts.day}</b>
                              </>
                            )}
                          </span>
                          <span className="panel-body">
                            <span className="panel-title">
                              <Highlight text={activity.title} keyword={value} />
                            </span>
                            <span className="panel-meta">
                              <span className="panel-category" style={{ color: category?.accent }}>
                                {category?.name}
                              </span>
                              <span>
                                {activity.location === "信息未注明" ? activity.dateLabel : activity.location}
                              </span>
                            </span>
                          </span>
                          <CaretRight size={14} weight="bold" className="panel-arrow" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <button type="button" className="panel-more" onClick={() => submit()}>
                  查看全部 {results.length} 条结果
                  <ArrowRight size={14} weight="bold" />
                </button>
              </>
            ) : (
              <p className="panel-empty">没有匹配的活动，换个关键词试试</p>
            )
          ) : (
            <>
              <p className="panel-label">大家都在搜</p>
              <div className="panel-chips">
                {hotKeywords.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    className="chip"
                    onClick={() => {
                      setValue(tag);
                      setOpen(true);
                    }}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      ) : null}
    </div>
  );
}

// ---------------------------------------------------------------- 顶栏与页脚

function Header({ route }) {
  return (
    <header className="site-header">
      <div className="header-inner">
        <button type="button" className="brand" onClick={() => navigate("#/")}>
          <span className="brand-text">
            <b>校园活动汇</b>
            <i>找活动，从这一页开始</i>
          </span>
        </button>
        <SearchBox route={route} />
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <p>校园活动汇 · 学生活动信息聚合</p>
      <p className="footer-hint">
        活动信息整理自各活动方发布内容，时间、地点如有调整以活动方最新通知为准；学生自发活动请自行核实后再参加。
      </p>
    </footer>
  );
}

// ---------------------------------------------------------------- 活动卡片

function ActivityCard({ activity }) {
  const category = categoryOf(activity);
  const parts = dateParts(activity);
  return (
    <button
      type="button"
      className="activity-card"
      style={{ "--accent": category?.accent, "--accent-soft": category?.accentSoft }}
      onClick={() => navigate(`#/a/${activity.id}`)}
    >
      <span className={`activity-date ${parts.kind === "open" ? "is-open" : ""}`}>
        {parts.kind === "open" ? (
          <span className="activity-open">长期</span>
        ) : (
          <>
            <span className="activity-month">{parts.month}</span>
            <span className="activity-day">{parts.day}</span>
            {parts.kind === "deadline" ? <span className="activity-kind">截止</span> : null}
          </>
        )}
      </span>
      <span className="activity-body">
        <span className="activity-top">
          <span className="activity-category">{category?.name}</span>
          <TrustBadge trust={activity.trust} />
          <StatusPill status={activity.status} />
        </span>
        <span className="activity-title">{activity.title}</span>
        <span className="activity-meta">
          <Clock size={14} weight="bold" />
          {activity.timeLabel}
        </span>
        <span className={`activity-meta ${activity.location === "信息未注明" ? "is-unknown" : ""}`}>
          <MapPin size={14} weight="bold" />
          {activity.location === "信息未注明" ? "地点未注明" : activity.location}
        </span>
        <span className="activity-tags">
          {activity.tags.slice(0, 3).map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </span>
      </span>
      <ArrowRight size={16} weight="bold" className="activity-arrow" />
    </button>
  );
}

// ---------------------------------------------------------------- 首页

function HomePage() {
  const featured = useMemo(
    () =>
      [...ACTIVITIES]
        .filter((item) => item.startDate && item.status !== "已结束")
        .sort((a, b) => a.startDate.localeCompare(b.startDate))
        .slice(0, 3),
    [],
  );
  const openCount = ACTIVITIES.filter((item) => item.status === "报名中").length;

  return (
    <div className="page">
      <section className="hero">
        <p className="hero-eyebrow">
          <Sparkle size={14} weight="fill" />
          今日校园 · 2026 年 9 月 19 日
        </p>
        <h1 className="hero-title">今天，去参加点什么</h1>
        <p className="hero-subtitle">
          共 {CATEGORIES.length} 个活动板块、{ACTIVITIES.length} 场活动，其中 {openCount} 场正在报名。
          点开板块看看，别让机会只在群里飘过。
        </p>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">最近值得去</h2>
          <span className="section-hint">按开始时间排序，先到先得</span>
        </div>
        <div className="featured-grid">
          {featured.map((activity) => {
            const category = categoryOf(activity);
            return (
              <button
                type="button"
                key={activity.id}
                className="featured-card"
                style={{ "--accent": category?.accent, "--accent-soft": category?.accentSoft }}
                onClick={() => navigate(`#/a/${activity.id}`)}
              >
                <span className="featured-head">
                  <span className="featured-category">{category?.name}</span>
                  <StatusPill status={activity.status} />
                </span>
                <span className="featured-title">{activity.title}</span>
                <span className="featured-date">
                  {activity.dateLabel}
                  {activity.location === "信息未注明" ? "" : ` · ${activity.location}`}
                </span>
                <span className="featured-more">
                  查看详情
                  <ArrowRight size={14} weight="bold" />
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="section">
        <div className="section-head">
          <h2 className="section-title">按领域逛板块</h2>
          <span className="section-hint">每个板块对应一类活动，点进去看全部</span>
        </div>
        <div className="category-grid">
          {CATEGORIES.map((category) => {
            const count = activitiesOfCategory(category.id).length;
            return (
              <button
                type="button"
                key={category.id}
                className="category-card"
                style={{ "--accent": category.accent, "--accent-soft": category.accentSoft }}
                onClick={() => navigate(`#/c/${category.id}`)}
              >
                <span className="category-icon">
                  <CategoryIcon name={category.icon} />
                </span>
                <span className="category-name">{category.name}</span>
                <span className="category-tagline">{category.tagline}</span>
                <span className="category-desc">{category.description}</span>
                <span className="category-foot">
                  <span className="category-count">{count} 场活动</span>
                  <span className="category-enter">
                    查看板块
                    <ArrowRight size={14} weight="bold" />
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

// ---------------------------------------------------------------- 板块详情

function CategoryPage({ categoryId }) {
  const category = CATEGORY_BY_ID[categoryId];
  const [statusFilter, setStatusFilter] = useState("全部");
  useScrollTopOnRouteChange(`c-${categoryId}`);

  if (!category) {
    return (
      <div className="page">
        <EmptyState title="这个板块不存在" hint="可能是链接过期了，回首页重新挑一个吧。" />
        <button type="button" className="back-link" onClick={() => navigate("#/")}>
          <ArrowLeft size={15} weight="bold" />
          返回首页
        </button>
      </div>
    );
  }

  const all = activitiesOfCategory(categoryId);
  const statuses = STATUS_ORDER.filter((status) => all.some((item) => item.status === status));
  const list = statusFilter === "全部" ? all : all.filter((item) => item.status === statusFilter);

  return (
    <div className="page">
      <button type="button" className="back-link" onClick={() => navigate("#/")}>
        <ArrowLeft size={15} weight="bold" />
        返回首页
      </button>

      <section className="category-hero" style={{ "--accent": category.accent, "--accent-soft": category.accentSoft }}>
        <span className="category-hero-icon">
          <CategoryIcon name={category.icon} size={26} />
        </span>
        <div className="category-hero-text">
          <h1 className="category-hero-title">{category.name}</h1>
          <p className="category-hero-tagline">{category.tagline}</p>
          <p className="category-hero-desc">{category.description}</p>
        </div>
        <span className="category-hero-count">
          <b>{all.length}</b>
          场活动
        </span>
      </section>

      <div className="filter-bar">
        <span className="filter-label">筛选</span>
        {["全部", ...statuses].map((status) => (
          <button
            key={status}
            type="button"
            className={`chip ${statusFilter === status ? "chip-active" : ""}`}
            onClick={() => setStatusFilter(status)}
          >
            {status}
          </button>
        ))}
      </div>

      {list.length ? (
        <div className="activity-list">
          {list.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      ) : (
        <EmptyState title="这个筛选下暂时没有活动" hint="换一个状态试试，或者看看全部活动。" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- 活动详情

function InfoRow({ icon, label, value, highlight }) {
  const isUnknown = value === "信息未注明";
  return (
    <div className={`info-row ${highlight && !isUnknown ? "is-highlight" : ""}`}>
      <span className="info-icon">{icon}</span>
      <span className="info-label">{label}</span>
      <span className={`info-value ${isUnknown ? "is-unknown" : ""}`}>{value}</span>
    </div>
  );
}

function ActivityPage({ activityId }) {
  const activity = ACTIVITY_BY_ID[activityId];
  useScrollTopOnRouteChange(`a-${activityId}`);

  if (!activity) {
    return (
      <div className="page">
        <EmptyState title="这场活动找不到了" hint="可能已经下线，回首页看看别的。" />
        <button type="button" className="back-link" onClick={() => navigate("#/")}>
          <ArrowLeft size={15} weight="bold" />
          返回首页
        </button>
      </div>
    );
  }

  const category = categoryOf(activity);
  const related = activitiesOfCategory(activity.categoryId)
    .filter((item) => item.id !== activity.id)
    .slice(0, 2);

  return (
    <div className="page">
      <button type="button" className="back-link" onClick={() => navigate(`#/c/${category.id}`)}>
        <ArrowLeft size={15} weight="bold" />
        返回{category.name}
      </button>

      <article className="detail" style={{ "--accent": category.accent, "--accent-soft": category.accentSoft }}>
        <div className="detail-head">
          <span className="detail-crumb" style={{ color: category.accent }}>
            {category.name}
          </span>
          <TrustBadge trust={activity.trust} />
          <StatusPill status={activity.status} />
        </div>
        <h1 className="detail-title">{activity.title}</h1>
        <p className="detail-summary">{activity.summary}</p>
        <div className="detail-tags">
          {activity.tags.map((tag) => (
            <span className="tag" key={tag}>
              {tag}
            </span>
          ))}
        </div>

        {activity.notice ? (
          <p className="notice-block">
            <Megaphone size={16} weight="bold" />
            <span>
              <b>最新通知</b>
              {activity.notice}
            </span>
          </p>
        ) : null}

        <div className="info-card">
          <InfoRow icon={<Clock size={16} weight="bold" />} label="活动时间" value={activity.timeLabel} />
          <InfoRow icon={<MapPin size={16} weight="bold" />} label="活动地点" value={activity.location} />
          <InfoRow icon={<Buildings size={16} weight="bold" />} label="主办单位" value={activity.organizer} />
          <InfoRow icon={<Users size={16} weight="bold" />} label="面向对象" value={activity.audience} />
          <InfoRow icon={<SealCheck size={16} weight="bold" />} label="名额" value={activity.capacity} />
          <InfoRow icon={<Ticket size={16} weight="bold" />} label="费用" value={activity.fee} />
          <InfoRow
            icon={<CalendarBlank size={16} weight="bold" />}
            label="报名截止"
            value={activity.deadline}
            highlight
          />
        </div>

        <section className="detail-section">
          <h2 className="detail-section-title">活动介绍</h2>
          {activity.detail.map((paragraph) => (
            <p className="detail-paragraph" key={paragraph}>
              {paragraph}
            </p>
          ))}
        </section>

        {activity.agenda?.length ? (
          <section className="detail-section">
            <h2 className="detail-section-title">时间安排</h2>
            <ol className="agenda">
              {activity.agenda.map((item) => (
                <li className="agenda-item" key={`${item.label}-${item.text}`}>
                  <span className="agenda-label">{item.label}</span>
                  <span className="agenda-text">{item.text}</span>
                </li>
              ))}
            </ol>
          </section>
        ) : null}

        <section className="detail-section">
          <h2 className="detail-section-title">怎么报名</h2>
          <p className="detail-paragraph">
            <CheckCircle size={16} weight="bold" className="inline-icon" />
            {activity.registration === "信息未注明"
              ? "报名方式未注明，建议向活动方或所在学院确认"
              : activity.registration}
          </p>
          <p className="detail-paragraph muted">
            <EnvelopeSimple size={16} weight="bold" className="inline-icon" />
            {activity.contact === "信息未注明" ? "联系方式未注明" : activity.contact}
          </p>
        </section>

        {related.length ? (
          <section className="detail-section">
            <h2 className="detail-section-title">同板块还有</h2>
            <div className="related-list">
              {related.map((item) => (
                <button key={item.id} type="button" className="related-item" onClick={() => navigate(`#/a/${item.id}`)}>
                  <span className="related-date">{item.dateLabel}</span>
                  <span className="related-title">{item.title}</span>
                  <ArrowRight size={14} weight="bold" />
                </button>
              ))}
            </div>
          </section>
        ) : null}
      </article>
    </div>
  );
}

// ---------------------------------------------------------------- 搜索结果页

function SearchPage({ keyword }) {
  useScrollTopOnRouteChange(`s-${keyword}`);
  const results = useMemo(() => searchActivities(keyword), [keyword]);

  return (
    <div className="page">
      <button type="button" className="back-link" onClick={() => navigate("#/")}>
        <ArrowLeft size={15} weight="bold" />
        返回首页
      </button>
      <div className="search-head">
        <h1 className="search-head-title">
          「{keyword}」的搜索结果
        </h1>
        <p className="search-head-hint">共 {results.length} 场活动</p>
      </div>
      {results.length ? (
        <div className="activity-list">
          {results.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      ) : (
        <EmptyState title="没有找到相关活动" hint="换个关键词试试，比如「数学建模」「志愿者」「宣讲会」。" />
      )}
    </div>
  );
}

// ---------------------------------------------------------------- 应用外壳

export function App() {
  const route = useRoute();
  const routeKey = useMemo(() => JSON.stringify(route), [route]);

  useScrollTopOnRouteChange(routeKey);

  return (
    <div className="app">
      <Header route={route} />
      <main className="main">
        {route.name === "category" ? <CategoryPage categoryId={route.categoryId} /> : null}
        {route.name === "activity" ? <ActivityPage activityId={route.activityId} /> : null}
        {route.name === "search" ? <SearchPage keyword={route.keyword} /> : null}
        {route.name === "home" ? <HomePage /> : null}
      </main>
      <Footer />
    </div>
  );
}

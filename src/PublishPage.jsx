// 发布 / 编辑活动信息页（#/publish 与 #/publish?id=xxx）
// 学生可以在这里主动发布活动或招募信息，发布后立刻出现在对应板块里

import { useState } from "react";
import { ArrowLeft, Trash, WarningCircle } from "@phosphor-icons/react";
import { CATEGORIES } from "./data/activities.js";
import { useData } from "./store.jsx";
import { createId, formatDateRange, DEFAULT_NICKNAME } from "./storage.js";

const UNKNOWN = "信息未注明";

const STATUS_OPTIONS = ["报名中", "即将开始", "进行中", "长期开放"];

function emptyForm() {
  return {
    categoryId: CATEGORIES[0].id,
    title: "",
    summary: "",
    mode: "scheduled",
    startDate: "",
    endDate: "",
    timeLabel: "",
    status: "报名中",
    deadline: "",
    location: "",
    organizer: "学生个人发布",
    audience: "",
    capacity: "",
    fee: "",
    registration: "",
    contact: "",
    tags: "",
    detailText: "",
  };
}

// 编辑已有信息时，把活动对象还原成表单字段
function formFromActivity(activity) {
  const scheduled = activity.dateKind !== "open";
  const unknownToEmpty = (value) => (value === UNKNOWN || value === "长期开放" ? "" : value || "");
  return {
    categoryId: activity.categoryId,
    title: activity.title,
    summary: activity.summary,
    mode: scheduled ? "scheduled" : "open",
    startDate: activity.startDate || "",
    endDate: activity.endDate || "",
    timeLabel: scheduled ? (activity.timeLabel || "").replace(activity.dateLabel || "", "").trim() : "",
    status: activity.status,
    deadline: unknownToEmpty(activity.deadline),
    location: unknownToEmpty(activity.location),
    organizer: activity.organizer || "学生个人发布",
    audience: unknownToEmpty(activity.audience),
    capacity: unknownToEmpty(activity.capacity),
    fee: unknownToEmpty(activity.fee),
    registration: unknownToEmpty(activity.registration),
    contact: unknownToEmpty(activity.contact),
    tags: (activity.tags || []).join("、"),
    detailText: (activity.detail || []).join("\n"),
  };
}

function parseTags(value) {
  return value
    .split(/[,，、;；\s]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 5);
}

function buildActivity(form, base) {
  const scheduled = form.mode === "scheduled";
  const startDate = scheduled ? form.startDate : null;
  const endDate = scheduled && form.endDate && form.endDate !== form.startDate ? form.endDate : null;
  const dateLabel = scheduled ? formatDateRange(startDate, endDate) : "长期开放";
  const timeLabel = scheduled
    ? [dateLabel, form.timeLabel.trim()].filter(Boolean).join(" ")
    : form.timeLabel.trim() || "长期开放";
  const tags = parseTags(form.tags);
  const detail = form.detailText
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean);

  return {
    id: base?.id || createId("user"),
    categoryId: form.categoryId,
    title: form.title.trim(),
    summary: form.summary.trim(),
    status: form.status,
    dateKind: scheduled ? "event" : "open",
    startDate,
    endDate,
    dateLabel,
    timeLabel,
    location: form.location.trim() || UNKNOWN,
    organizer: form.organizer.trim() || "学生个人发布",
    audience: form.audience.trim() || UNKNOWN,
    capacity: form.capacity.trim() || UNKNOWN,
    fee: form.fee.trim() || UNKNOWN,
    deadline: form.deadline.trim() || (scheduled ? UNKNOWN : "长期开放"),
    registration: form.registration.trim() || UNKNOWN,
    contact: form.contact.trim() || UNKNOWN,
    tags: tags.length ? tags : ["学生发布"],
    summaryIsFallback: false,
    detail: detail.length ? detail : [form.summary.trim()],
    trust: "学生自发",
    mine: true,
    createdAt: base?.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

function validate(form) {
  const errors = [];
  if (!form.categoryId) errors.push("请选择活动所属板块");
  if (!form.title.trim()) errors.push("请填写活动名称");
  else if (form.title.trim().length > 40) errors.push("活动名称请控制在 40 字以内");
  if (!form.summary.trim()) errors.push("请写一句活动简介，方便其他同学快速判断要不要参加");
  else if (form.summary.trim().length > 60) errors.push("活动简介请控制在 60 字以内");
  if (form.mode === "scheduled") {
    if (!form.startDate) errors.push("请选择活动日期");
    if (!form.timeLabel.trim()) errors.push("请填写具体时间，例如「19:00 - 21:00」");
    if (form.endDate && form.startDate && form.endDate < form.startDate) {
      errors.push("结束日期不能早于开始日期");
    }
  } else if (!form.timeLabel.trim()) {
    errors.push("长期活动请写明开展方式，例如「长期招募，满员即止」");
  }
  if (parseTags(form.tags).length > 5) errors.push("标签最多 5 个");
  return errors;
}

export function PublishPage({ editId }) {
  const { activityById, savePost, removePost } = useData();
  const editing = editId ? activityById[editId] : null;
  const [form, setForm] = useState(() => (editing ? formFromActivity(editing) : emptyForm()));
  const [errors, setErrors] = useState([]);

  const update = (key) => (event) => {
    const value = event.target.value;
    setForm((current) => ({ ...current, [key]: value }));
    setErrors([]);
  };

  if (editId && !editing) {
    return (
      <div className="page">
        <button type="button" className="back-link" onClick={() => window.history.back()}>
          <ArrowLeft size={15} weight="bold" />
          返回
        </button>
        <div className="empty-state">
          <WarningCircle size={22} weight="bold" />
          <p className="empty-title">找不到这条信息</p>
          <p className="empty-hint">它可能已经被删除，或者只存在于发布它的那台设备上。</p>
        </div>
      </div>
    );
  }

  const submit = (event) => {
    event.preventDefault();
    const found = validate(form);
    if (found.length) {
      setErrors(found);
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }
    const activity = buildActivity(form, editing);
    savePost(activity);
    window.location.hash = `#/a/${activity.id}`;
  };

  const onDelete = () => {
    if (!editing) return;
    if (!window.confirm("删除这条信息？删除后无法恢复。")) return;
    removePost(editing.id);
    window.location.hash = "#/";
  };

  return (
    <div className="page publish-page">
      <button type="button" className="back-link" onClick={() => window.history.back()}>
        <ArrowLeft size={15} weight="bold" />
        返回
      </button>

      <header className="publish-head">
        <h1 className="publish-title">{editing ? "编辑活动信息" : "发布活动信息"}</h1>
        <p className="publish-subtitle">
          把活动名称、时间、地点这些关键信息写清楚，其他同学点进来就能看懂。发布后会立刻出现在对应板块里，
          保存在本机浏览器，刷新或重新打开页面都还在。
        </p>
      </header>

      {errors.length ? (
        <ul className="form-errors">
          {errors.map((item) => (
            <li key={item}>
              <WarningCircle size={15} weight="bold" />
              {item}
            </li>
          ))}
        </ul>
      ) : null}

      <form className="publish-form" onSubmit={submit}>
        <fieldset className="form-block">
          <legend>基本信息</legend>
          <div className="form-grid">
            <label className="field">
              <span>
                所属板块 <b className="required">必填</b>
              </span>
              <select value={form.categoryId} onChange={update("categoryId")}>
                {CATEGORIES.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name} · {category.tagline}
                  </option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>
                当前状态 <b className="required">必填</b>
              </span>
              <select value={form.status} onChange={update("status")}>
                {STATUS_OPTIONS.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>
            </label>

            <label className="field field-wide">
              <span>
                活动名称 <b className="required">必填</b>
              </span>
              <input
                type="text"
                value={form.title}
                maxLength={60}
                placeholder="例如：周末羽毛球约球"
                onChange={update("title")}
              />
            </label>

            <label className="field field-wide">
              <span>
                一句话简介 <b className="required">必填</b>
              </span>
              <input
                type="text"
                value={form.summary}
                maxLength={80}
                placeholder="例如：计划 6 - 8 人，费用 AA，场地待定"
                onChange={update("summary")}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="form-block">
          <legend>时间与地点</legend>
          <div className="form-grid">
            <label className="field">
              <span>
                活动形式 <b className="required">必填</b>
              </span>
              <select value={form.mode} onChange={update("mode")}>
                <option value="scheduled">有明确时间</option>
                <option value="open">长期招募 / 长期开放</option>
              </select>
            </label>

            {form.mode === "scheduled" ? (
              <>
                <label className="field">
                  <span>
                    活动日期 <b className="required">必填</b>
                  </span>
                  <input type="date" value={form.startDate} onChange={update("startDate")} />
                </label>
                <label className="field">
                  <span>结束日期（可选）</span>
                  <input type="date" value={form.endDate} onChange={update("endDate")} />
                </label>
                <label className="field">
                  <span>
                    具体时间 <b className="required">必填</b>
                  </span>
                  <input
                    type="text"
                    value={form.timeLabel}
                    placeholder="例如：19:00 - 21:00"
                    onChange={update("timeLabel")}
                  />
                </label>
              </>
            ) : (
              <label className="field">
                <span>
                  开展方式 <b className="required">必填</b>
                </span>
                <input
                  type="text"
                  value={form.timeLabel}
                  placeholder="例如：长期招募，满员即止"
                  onChange={update("timeLabel")}
                />
              </label>
            )}

            <label className="field">
              <span>报名截止</span>
              <input
                type="text"
                value={form.deadline}
                placeholder="例如：9 月 22 日 18:00 截止"
                onChange={update("deadline")}
              />
            </label>

            <label className="field field-wide">
              <span>活动地点</span>
              <input
                type="text"
                value={form.location}
                placeholder="例如：体育馆 二层羽毛球场；未确定可写「场地待确认」"
                onChange={update("location")}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="form-block">
          <legend>参与信息</legend>
          <div className="form-grid">
            <label className="field">
              <span>发起方 / 主办</span>
              <input type="text" value={form.organizer} onChange={update("organizer")} />
            </label>
            <label className="field">
              <span>面向对象</span>
              <input
                type="text"
                value={form.audience}
                placeholder="例如：全校学生，零基础可参加"
                onChange={update("audience")}
              />
            </label>
            <label className="field">
              <span>名额</span>
              <input type="text" value={form.capacity} placeholder="例如：限 20 人" onChange={update("capacity")} />
            </label>
            <label className="field">
              <span>费用</span>
              <input type="text" value={form.fee} placeholder="例如：免费 / 费用 AA" onChange={update("fee")} />
            </label>
            <label className="field field-wide">
              <span>报名方式</span>
              <input
                type="text"
                value={form.registration}
                placeholder="例如：群里接龙 / 扫码填表 / 直接到场"
                onChange={update("registration")}
              />
            </label>
            <label className="field field-wide">
              <span>联系方式</span>
              <input
                type="text"
                value={form.contact}
                placeholder="例如：微信 xxxx；只在公开渠道填写，避免泄露隐私"
                onChange={update("contact")}
              />
            </label>
            <label className="field field-wide">
              <span>标签（用顿号或逗号分隔，最多 5 个）</span>
              <input
                type="text"
                value={form.tags}
                placeholder="例如：羽毛球、约球、AA"
                onChange={update("tags")}
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="form-block">
          <legend>活动介绍</legend>
          <div className="form-grid">
            <label className="field field-wide">
              <span>详细介绍（换行会分成段落，可留空）</span>
              <textarea
                rows={5}
                value={form.detailText}
                placeholder="补充说明规则、注意事项、集合方式等"
                onChange={update("detailText")}
              />
            </label>
          </div>
        </fieldset>

        <div className="publish-actions">
          <button type="submit" className="primary-button">
            {editing ? "保存修改" : "发布活动"}
          </button>
          <button type="button" className="ghost-button" onClick={() => window.history.back()}>
            取消
          </button>
          {editing ? (
            <button type="button" className="danger-button" onClick={onDelete}>
              <Trash size={15} weight="bold" />
              删除这条信息
            </button>
          ) : null}
          <span className="publish-note">
            未填写的字段会显示「信息未注明」，不会自动编造内容。昵称默认使用「{DEFAULT_NICKNAME}」。
          </span>
        </div>
      </form>
    </div>
  );
}

// 本地持久化：把用户发布的活动、评论、昵称存进浏览器 localStorage
// 说明：这是纯前端原型，没有服务器，数据只保存在当前浏览器里；
// 换设备、换浏览器或清理浏览器数据后会丢失，页面上会向用户说明这一点。

const PREFIX = "campus-activity-hub";

export const STORAGE_KEYS = {
  posts: `${PREFIX}:posts:v1`,
  comments: `${PREFIX}:comments:v1`,
  profile: `${PREFIX}:profile:v1`,
};

export const DEFAULT_NICKNAME = "同学";

function readJson(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (Array.isArray(fallback)) return Array.isArray(parsed) ? parsed : fallback;
    if (fallback && typeof fallback === "object") {
      return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
    }
    return parsed ?? fallback;
  } catch (error) {
    console.warn("[storage] 读取失败，已退回默认值", key, error);
    return fallback;
  }
}

// 写入成功返回 true；浏览器禁用存储或超出配额时返回 false，由界面提示用户
function writeJson(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn("[storage] 写入失败", key, error);
    return false;
  }
}

export function loadPosts() {
  const posts = readJson(STORAGE_KEYS.posts, []);
  return posts.filter((item) => item && typeof item === "object" && item.id && item.title);
}

export function savePosts(posts) {
  return writeJson(STORAGE_KEYS.posts, posts);
}

export function loadComments() {
  const comments = readJson(STORAGE_KEYS.comments, []);
  return comments.filter(
    (item) => item && typeof item === "object" && item.id && item.activityId && typeof item.content === "string",
  );
}

export function saveComments(comments) {
  return writeJson(STORAGE_KEYS.comments, comments);
}

export function loadProfile() {
  const profile = readJson(STORAGE_KEYS.profile, {});
  return { nickname: typeof profile.nickname === "string" && profile.nickname.trim() ? profile.nickname : DEFAULT_NICKNAME };
}

export function saveProfile(profile) {
  return writeJson(STORAGE_KEYS.profile, profile);
}

export function createId(prefix) {
  const stamp = Date.now().toString(36);
  const random = Math.random().toString(36).slice(2, 7);
  return `${prefix}-${stamp}-${random}`;
}

// 评论时间显示：今天显示「今天 15:04」，今年内显示「9 月 19 日 15:04」，跨年显示完整日期
export function formatCommentTime(iso) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  const pad = (value) => String(value).padStart(2, "0");
  const clock = `${pad(date.getHours())}:${pad(date.getMinutes())}`;
  const now = new Date();
  const sameDay =
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate();
  if (sameDay) return `今天 ${clock}`;
  const monthDay = `${date.getMonth() + 1} 月 ${date.getDate()} 日 ${clock}`;
  return date.getFullYear() === now.getFullYear() ? monthDay : `${date.getFullYear()} 年 ${monthDay}`;
}

// 把 "2026-09-21" 转成「9 月 21 日」，带结束日期时输出区间
export function formatDateRange(startDate, endDate) {
  if (!startDate) return "";
  const toParts = (value) => {
    const [, month, day] = value.split("-");
    return { month: Number(month), day: Number(day) };
  };
  const start = toParts(startDate);
  const startText = `${start.month} 月 ${start.day} 日`;
  if (!endDate || endDate === startDate) return startText;
  const end = toParts(endDate);
  if (end.month === start.month) return `${startText} - ${end.day} 日`;
  return `${startText} - ${end.month} 月 ${end.day} 日`;
}

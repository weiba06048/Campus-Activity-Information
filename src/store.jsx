// 全站数据仓库：静态活动数据 + 用户自己发布的活动 + 评论 + 用户昵称
// 用户产生的内容全部写进 localStorage，刷新或重新打开页面后仍然在

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { ACTIVITIES, activitiesOfCategory, categoryOf, searchActivities } from "./data/activities.js";
import {
  DEFAULT_NICKNAME,
  createId,
  loadComments,
  loadPosts,
  loadProfile,
  loadThreads,
  saveComments,
  savePosts,
  saveProfile,
  saveThreads,
  threadActiveAt,
} from "./storage.js";

const DataContext = createContext(null);

export function DataProvider({ children }) {
  const [posts, setPosts] = useState(() => loadPosts());
  const [comments, setComments] = useState(() => loadComments());
  const [threads, setThreads] = useState(() => loadThreads());
  const [profile, setProfile] = useState(() => loadProfile());
  const [storageWarning, setStorageWarning] = useState("");

  useEffect(() => {
    if (!savePosts(posts)) setStorageWarning("浏览器本地存储不可用，你发布的活动在刷新后可能丢失");
  }, [posts]);

  useEffect(() => {
    if (!saveComments(comments)) setStorageWarning("浏览器本地存储不可用，评论在刷新后可能丢失");
  }, [comments]);

  useEffect(() => {
    saveProfile(profile);
  }, [profile]);

  useEffect(() => {
    if (!saveThreads(threads)) setStorageWarning("浏览器本地存储不可用，你发在论坛里的内容在刷新后可能丢失");
  }, [threads]);

  // 用户发布的活动排在前面，保证自己刚发完就能看到
  const activities = useMemo(() => [...posts, ...ACTIVITIES], [posts]);
  const activityById = useMemo(
    () => Object.fromEntries(activities.map((item) => [item.id, item])),
    [activities],
  );

  const commentsOf = useCallback(
    (activityId) =>
      comments
        .filter((item) => item.activityId === activityId)
        .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt))),
    [comments],
  );

  const commentCountOf = useCallback(
    (activityId) => comments.reduce((total, item) => (item.activityId === activityId ? total + 1 : total), 0),
    [comments],
  );

  const savePost = useCallback((post) => {
    setPosts((list) => {
      const index = list.findIndex((item) => item.id === post.id);
      if (index === -1) return [post, ...list];
      const next = [...list];
      next[index] = post;
      return next;
    });
  }, []);

  const removePost = useCallback((postId) => {
    setPosts((list) => list.filter((item) => item.id !== postId));
  }, []);

  const addComment = useCallback((activityId, content, author) => {
    const comment = {
      id: createId("comment"),
      activityId,
      content,
      author: (author || "").trim() || DEFAULT_NICKNAME,
      createdAt: new Date().toISOString(),
      mine: true,
    };
    setComments((list) => [comment, ...list]);
    return comment;
  }, []);

  const removeComment = useCallback((commentId) => {
    setComments((list) => list.filter((item) => item.id !== commentId));
  }, []);

  const updateNickname = useCallback((nickname) => {
    setProfile({ nickname: nickname || DEFAULT_NICKNAME });
  }, []);

  // 论坛：帖子按「最后回复时间」排序，刚有人回复的帖子会浮到最上面
  const threadList = useMemo(
    () => [...threads].sort((a, b) => threadActiveAt(b).localeCompare(threadActiveAt(a))),
    [threads],
  );
  const threadById = useMemo(
    () => Object.fromEntries(threads.map((item) => [item.id, item])),
    [threads],
  );

  const saveThread = useCallback((thread) => {
    setThreads((list) => {
      const index = list.findIndex((item) => item.id === thread.id);
      if (index === -1) return [thread, ...list];
      const next = [...list];
      next[index] = thread;
      return next;
    });
  }, []);

  const removeThread = useCallback((threadId) => {
    setThreads((list) => list.filter((item) => item.id !== threadId));
  }, []);

  const addReply = useCallback((threadId, content, author) => {
    const reply = {
      id: createId("reply"),
      content,
      author: (author || "").trim() || DEFAULT_NICKNAME,
      createdAt: new Date().toISOString(),
      mine: true,
    };
    setThreads((list) =>
      list.map((item) => (item.id === threadId ? { ...item, replies: [...(item.replies || []), reply] } : item)),
    );
    return reply;
  }, []);

  const removeReply = useCallback((threadId, replyId) => {
    setThreads((list) =>
      list.map((item) =>
        item.id === threadId ? { ...item, replies: (item.replies || []).filter((reply) => reply.id !== replyId) } : item,
      ),
    );
  }, []);

  const value = useMemo(
    () => ({
      activities,
      activityById,
      posts,
      categoryOf,
      ofCategory: (categoryId) => activitiesOfCategory(categoryId, activities),
      search: (keyword) => searchActivities(keyword, activities),
      commentsOf,
      commentCountOf,
      savePost,
      removePost,
      addComment,
      removeComment,
      threads: threadList,
      threadById,
      saveThread,
      removeThread,
      addReply,
      removeReply,
      profile,
      updateNickname,
      storageWarning,
    }),
    [
      activities,
      activityById,
      posts,
      commentsOf,
      commentCountOf,
      savePost,
      removePost,
      addComment,
      removeComment,
      threadList,
      threadById,
      saveThread,
      removeThread,
      addReply,
      removeReply,
      profile,
      updateNickname,
      storageWarning,
    ],
  );

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>;
}

export function useData() {
  const value = useContext(DataContext);
  if (!value) throw new Error("useData 需要在 DataProvider 内部使用");
  return value;
}

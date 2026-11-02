import type { Project } from './types';

/** Projectless chats run in `~/VENKY Code Chats/chat-<id>`, a project the window keeps out of project lists. */
const CHAT_FOLDER = /[\\/]VENKY Code Chats[\\/]chat-[0-9a-f]{8}$/;
export const isChatProject = (project: Pick<Project, 'path'> | undefined): boolean => Boolean(project && CHAT_FOLDER.test(project.path));
/** The project picker's "No project" row. */
export const NO_PROJECT = 'no-project';

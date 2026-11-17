import type { UiMapEntry } from '../../types/uiMapTypes';

export const StudentPrivateFilesUiMap: Record<string, UiMapEntry> = {
  moodle_studentPrivateFiles_menuLink: {
    widgetType: 'LINK',
    strategy: 'css',
    selector: 'a[role="menuitem"][href*="/user/files.php"]',
  },
  moodle_studentPrivateFiles_managerLabel: {
    widgetType: 'LABEL',
    strategy: 'css',
    selector: '.filemanager.fm-loaded:has(.fp-path-folder-name)',
  },
  moodle_studentPrivateFiles_addButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: 'Add...',
    exact: true,
  },
  moodle_studentPrivateFiles_attachmentFileUpload: {
    widgetType: 'FILE_UPLOAD',
    strategy: 'css',
    selector: '.filepicker input[type="file"][name="repo_upload_file"]',
  },
  moodle_studentPrivateFiles_uploadButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: 'Upload this file',
    exact: true,
  },
  moodle_studentPrivateFiles_saveButton: {
    widgetType: 'BUTTON',
    strategy: 'role',
    role: 'button',
    name: 'Save changes',
    exact: true,
  },
  moodle_studentPrivateFiles_fileCard: {
    widgetType: 'CARD',
    strategy: 'css',
    selector: '.filemanager.fm-loaded .fp-filename',
  },
};

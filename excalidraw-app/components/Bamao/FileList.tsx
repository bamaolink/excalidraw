import type { ExcalidrawImperativeAPI } from "../../../packages/excalidraw/types";
import type { FileType } from "./Apis";
import "./FileList.scss";
import { CloseIcon } from "../../../packages/excalidraw/components/icons";
import React, { useEffect, useState } from "react";

import { createFile, updateFile, allFiles, signout, deleteFile } from "./Apis";
import { excalidrawUserNameKey, excalidrawUserTokenKey } from "./HttpClient";
import Toast from "./Toast";
import type { ItemToast, AddToast, RemoveToast } from "./Toast";

interface FileListProps {
  excalidrawAPI: ExcalidrawImperativeAPI | null;
}

const excalidrawFileIdKey = "excalidraw-file-id";
const excalidrawFileNameKey = "excalidraw-file-name";
const FileList: React.FC<FileListProps> = ({ excalidrawAPI }) => {
  const username = localStorage.getItem(excalidrawUserNameKey);
  const initFileId = localStorage.getItem(excalidrawFileIdKey) ?? -1;
  const initFileName = localStorage.getItem(excalidrawFileNameKey) ?? "";

  const [toasts, setToasts] = useState<ItemToast[]>([]);

  const addToast: AddToast = (message, type) => {
    const newToast = { id: Date.now(), message, type };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast: RemoveToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [isOpenUserMenu, setIsOpenUserMenu] = useState<boolean>(false);
  const [fileList, setFileList] = useState<FileType[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [currentFileId, setCurrentFileId] = useState<number>(+initFileId);
  const [currentFileTitle, setCurrentFileTitle] =
    useState<string>(initFileName);

  const onSave = () => {
    if (excalidrawAPI) {
      const elements = excalidrawAPI.getSceneElements();
      const appState = excalidrawAPI.getAppState();
      const files = excalidrawAPI.getFiles();
      const fileData = {
        type: "excalidraw",
        version: 2,
        source: window.location.href,
        elements,
        appState: {
          gridSize: appState.gridSize,
          gridStep: appState.gridStep,
          gridModeEnabled: appState.gridModeEnabled,
          viewBackgroundColor: appState.viewBackgroundColor,
        },
        files,
      };
      setLoading(true);

      const savePromise =
        currentFileId > 0
          ? updateFile(currentFileId, {
              title: currentFileTitle,
              content: JSON.stringify(fileData),
            })
          : createFile({
              title: currentFileTitle,
              content: JSON.stringify(fileData),
            });

      savePromise
        .then((res) => {
          if (res.code === 0) {
            if (currentFileId > 0) {
              setFileList((prev) => {
                return prev.map((file) => {
                  if (file.id === currentFileId) {
                    return res.data;
                  }
                  return file;
                });
              });
            } else {
              setFileList([...fileList, res.data]);
            }

            setCurrentFileId(res.data.id);
            setCurrentFileTitle(res.data.title);

            addToast("保存成功", "success");
          } else {
            addToast(res.msg || "出现错误", "error");
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  };

  const onSelectFile = (file: FileType) => {
    setCurrentFileId(file.id);
    setCurrentFileTitle(file.title);
    const fileData = JSON.parse(file.content);
    excalidrawAPI!.updateScene(fileData);
    excalidrawAPI!.scrollToContent(fileData.elements);
  };

  const onAddFile = () => {
    const fileData = {
      type: "excalidraw",
      version: 2,
      source: window.location.href,
      elements: [],
      appState: {},
      files: {},
    };
    createFile({
      title: "New File",
      content: JSON.stringify(fileData),
    }).then((res) => {
      if (res.code === 0) {
        setFileList([res.data, ...fileList]);

        onSelectFile(res.data);

        addToast("新增成功", "success");
      } else {
        addToast(res.msg || "出现错误", "error");
      }
    });
  };

  const onDeleteFile = (file: FileType) => {
    deleteFile(file.id).then((res) => {
      if (res.code === 0) {
        setFileList((prev) => {
          return prev.filter((item) => file.id !== item.id);
        });
        if (file.id === currentFileId) {
          setCurrentFileId(-1);
          setCurrentFileTitle("");
        }
        addToast("删除成功", "success");
      } else {
        addToast(res.msg || "出现错误", "error");
      }
    });
  };

  const onSignout = () => {
    signout().finally(() => {
      localStorage.removeItem(excalidrawUserTokenKey);
      localStorage.removeItem(excalidrawUserNameKey);
      window.location.reload();
    });
  };

  const onToggleEditing = (file: FileType, value?: boolean) => {
    setFileList((prev) => {
      return prev.map((item) => {
        if (item.id === file.id) {
          return {
            ...item,
            isEditing: typeof value === "boolean" ? value : !item.isEditing,
          };
        }
        return item;
      });
    });
  };

  const onToggleDisabled = (file: FileType, value?: boolean) => {
    setFileList((prev) => {
      return prev.map((item) => {
        if (item.id === file.id) {
          return {
            ...item,
            disabled: typeof value === "boolean" ? value : !item.disabled,
          };
        }
        return item;
      });
    });
  };

  const onUpdateFile = (file: FileType) => {
    onToggleDisabled(file, true);
    updateFile(file.id, {
      title: file.title,
      content: file.content,
    })
      .then((res) => {
        if (res.code === 0) {
          setFileList((prev) => {
            return prev.map((item) => {
              if (file.id === item.id) {
                return res.data;
              }
              return item;
            });
          });
          onToggleEditing(file, false);
          if (currentFileId === file.id) {
            setCurrentFileTitle(res.data.title);
          }
          addToast("编辑成功", "success");
        } else {
          addToast(res.msg || "出现错误", "error");
        }
      })
      .finally(() => {
        onToggleDisabled(file, false);
      });
  };

  const onUpdateTitle = (file: FileType, value: string) => {
    setFileList((prev) => {
      return prev.map((item) => {
        if (item.id === file.id) {
          return {
            ...item,
            title: value,
          };
        }
        return item;
      });
    });
  };

  useEffect(() => {
    allFiles().then((res) => {
      if (res.code === 0) {
        const list = res.data.map((file) => {
          return {
            ...file,
            isEditing: false,
            disabled: false,
          };
        });
        setFileList(list);
      }
    });
  }, []);

  useEffect(() => {
    localStorage.setItem(excalidrawFileIdKey, currentFileId.toString());
    localStorage.setItem(excalidrawFileNameKey, currentFileTitle);
  }, [currentFileId, currentFileTitle]);

  return (
    <div className="bm-file-list">
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          message={toast.message}
          type={toast.type}
          onClose={() => removeToast(toast.id)}
        />
      ))}
      <div className="userinfo">
        <button
          className="excalidraw-button collab-button"
          style={{ width: "fit-content" }}
          onClick={onSave}
          disabled={loading}
        >
          保存
        </button>
        <div className="userinfo">
          <button
            className="userinfo-button"
            onClick={() => setIsOpenUserMenu(!isOpenUserMenu)}
          >
            <svg
              viewBox="0 0 1024 1024"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
              width="200"
              height="200"
            >
              <path
                d="M512 74.666667C270.933333 74.666667 74.666667 270.933333 74.666667 512S270.933333 949.333333 512 949.333333 949.333333 753.066667 949.333333 512 753.066667 74.666667 512 74.666667zM288 810.666667c0-123.733333 100.266667-224 224-224S736 686.933333 736 810.666667c-61.866667 46.933333-140.8 74.666667-224 74.666666s-162.133333-27.733333-224-74.666666z m128-384c0-53.333333 42.666667-96 96-96s96 42.666667 96 96-42.666667 96-96 96-96-42.666667-96-96z m377.6 328.533333c-19.2-96-85.333333-174.933333-174.933333-211.2 32-29.866667 51.2-70.4 51.2-117.333333 0-87.466667-72.533333-160-160-160s-160 72.533333-160 160c0 46.933333 19.2 87.466667 51.2 117.333333-89.6 36.266667-155.733333 115.2-174.933334 211.2-55.466667-66.133333-91.733333-149.333333-91.733333-243.2 0-204.8 168.533333-373.333333 373.333333-373.333333S885.333333 307.2 885.333333 512c0 93.866667-34.133333 177.066667-91.733333 243.2z"
                fill="currentColor"
              ></path>
            </svg>
            {username}
          </button>
          {isOpenUserMenu && (
            <div className="userinfo-menu">
              <ul>
                <li>
                  <button
                    onClick={() => {
                      setIsOpen(true);
                      setIsOpenUserMenu(false);
                    }}
                  >
                    我的文件
                  </button>
                </li>
                <li>
                  <button onClick={onSignout}>退出登录</button>
                </li>
              </ul>
            </div>
          )}
        </div>
      </div>
      <div className={`file-list-drawer${isOpen ? " open" : ""}`}>
        <div className="header">
          <div className="title">我的文件</div>
          <div className="close">
            <button
              className="excalidraw-button sidebar__close"
              onClick={() => setIsOpen(false)}
            >
              {CloseIcon}
            </button>
          </div>
        </div>
        <div className="file-list-container">
          <ul className="file-list-ul">
            <li className="add" onClick={onAddFile}>
              <div className="icon">
                <svg
                  viewBox="0 0 1024 1024"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                  width="200"
                  height="200"
                >
                  <path
                    d="M590.77 571.077h324.922c15.754 0 29.539-13.785 29.539-29.539v-59.076c0-15.754-13.785-29.539-29.539-29.539H590.77c-11.815 0-19.692-7.877-19.692-19.692V108.308c0-15.754-13.785-29.539-29.539-29.539h-59.076c-15.754 0-29.539 13.785-29.539 29.539V433.23c0 11.815-7.877 19.692-19.692 19.692H108.308c-15.754 0-29.539 13.785-29.539 29.539v59.076c0 15.754 13.785 29.539 29.539 29.539H433.23c11.815 0 19.692 7.877 19.692 19.692v324.923c0 15.754 13.785 29.539 29.539 29.539h59.076c15.754 0 29.539-13.785 29.539-29.539V590.77c0-11.815 7.877-19.692 19.692-19.692z"
                    fill="currentColor"
                  ></path>
                </svg>
              </div>
              <div className="title">新建文件</div>
            </li>
            {fileList.map((item) => (
              <li
                key={item.id}
                className={item.id === currentFileId ? "active" : ""}
                onClick={() => onSelectFile(item)}
                onDoubleClick={() => onToggleEditing(item, true)}
              >
                {item.isEditing ? (
                  <div className="edit-form">
                    <div className="input">
                      <input
                        type="text"
                        value={item.title}
                        onChange={(e) => {
                          onUpdateTitle(item, e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            onUpdateFile(item);
                          }
                        }}
                      />
                    </div>
                    <div className="buttons">
                      <button
                        onClick={() => onUpdateFile(item)}
                        disabled={item.disabled}
                      >
                        保存
                      </button>
                      <button onClick={() => onToggleEditing(item, false)}>
                        取消
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="icon">
                      <svg
                        viewBox="0 0 1024 1024"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        width="200"
                        height="200"
                      >
                        <path
                          d="M707.648 947.2h-51.2v-206.528c0-28.224 22.976-51.2 51.2-51.2H876.8v51.2h-169.152V947.2z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M682.048 972.8H172.8a51.264 51.264 0 0 1-51.2-51.2V102.4c0-28.224 22.976-51.2 51.2-51.2h407.68a25.6 25.6 0 0 1 22.08 12.672l71.232 121.344 177.28-0.896c28.352 0 51.328 22.976 51.328 51.2v479.552a25.408 25.408 0 0 1-6.016 16.448l-194.752 232.128a25.728 25.728 0 0 1-19.584 9.152zM172.8 102.4v819.2h497.28l181.12-215.872V235.52l-191.872 0.96a24.512 24.512 0 0 1-22.208-12.672L565.824 102.336H172.736z"
                          fill="currentColor"
                        ></path>
                        <path
                          d="M859.2 133.504h-153.6a25.6 25.6 0 1 1 0-51.2h153.6a25.6 25.6 0 1 1 0 51.2zM521.6 435.2H268.8a25.6 25.6 0 1 1 0-51.2h252.8a25.6 25.6 0 1 1 0 51.2zM416 307.2H268.8a25.6 25.6 0 1 1 0-51.2h147.2a25.6 25.6 0 1 1 0 51.2zM742.4 563.2H268.8a25.6 25.6 0 1 1 0-51.2h473.6a25.6 25.6 0 1 1 0 51.2zM332.8 691.2h-64a25.6 25.6 0 1 1 0-51.2h64a25.6 25.6 0 1 1 0 51.2z"
                          fill="currentColor"
                        ></path>
                      </svg>
                    </div>
                    <div className="title">{item.title || "未命名"}</div>
                  </>
                )}

                <div className="btn-group">
                  <button title="打开">
                    <svg
                      viewBox="0 0 1024 1024"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      width="200"
                      height="200"
                    >
                      <path
                        d="M921.6 450.133333c-6.4-8.533333-14.933333-12.8-25.6-12.8h-10.666667V341.333333c0-40.533333-34.133333-74.666667-74.666666-74.666666H514.133333c-4.266667 0-6.4-2.133333-8.533333-4.266667l-38.4-66.133333c-12.8-21.333333-38.4-36.266667-64-36.266667H170.666667c-40.533333 0-74.666667 34.133333-74.666667 74.666667v597.333333c0 6.4 2.133333 12.8 6.4 19.2 6.4 8.533333 14.933333 12.8 25.6 12.8h640c12.8 0 25.6-8.533333 29.866667-21.333333l128-362.666667c4.266667-10.666667 2.133333-21.333333-4.266667-29.866667zM170.666667 224h232.533333c4.266667 0 6.4 2.133333 8.533333 4.266667l38.4 66.133333c12.8 21.333333 38.4 36.266667 64 36.266667H810.666667c6.4 0 10.666667 4.266667 10.666666 10.666666v96H256c-12.8 0-25.6 8.533333-29.866667 21.333334l-66.133333 185.6V234.666667c0-6.4 4.266667-10.666667 10.666667-10.666667z m573.866666 576H172.8l104.533333-298.666667h571.733334l-104.533334 298.666667z"
                        fill="currentColor"
                      ></path>
                    </svg>
                  </button>
                  <button title="修改" onClick={() => onToggleEditing(item)}>
                    <svg
                      viewBox="0 0 1024 1024"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      width="200"
                      height="200"
                    >
                      <path
                        d="M631.168 503.168a42.666667 42.666667 0 0 1 60.330667 60.330667l-320 320A42.666667 42.666667 0 0 1 341.333333 896H170.666667a42.666667 42.666667 0 0 1-42.666667-42.666667v-170.666666a42.666667 42.666667 0 0 1 12.501333-30.165334l554.666667-554.666666a42.666667 42.666667 0 0 1 60.330667 0l170.666666 170.666666a42.666667 42.666667 0 0 1 0 60.330667l-128 128a42.666667 42.666667 0 0 1-60.330666 0l-85.333334-85.333333a42.666667 42.666667 0 1 1 60.330667-60.330667L768 366.336 835.669333 298.666667 725.333333 188.330667l-512 512V810.666667h110.336l307.498667-307.498667z"
                        fill="currentColor"
                      ></path>
                    </svg>
                  </button>
                  <button title="删除" onClick={() => onDeleteFile(item)}>
                    <svg
                      viewBox="0 0 1024 1024"
                      version="1.1"
                      xmlns="http://www.w3.org/2000/svg"
                      width="200"
                      height="200"
                    >
                      <path
                        d="M607.897867 768.043004c-17.717453 0-31.994625-14.277171-31.994625-31.994625L575.903242 383.935495c0-17.717453 14.277171-31.994625 31.994625-31.994625s31.994625 14.277171 31.994625 31.994625l0 351.94087C639.892491 753.593818 625.61532 768.043004 607.897867 768.043004z"
                        fill="currentColor"
                      ></path>
                      <path
                        d="M415.930119 768.043004c-17.717453 0-31.994625-14.277171-31.994625-31.994625L383.935495 383.935495c0-17.717453 14.277171-31.994625 31.994625-31.994625 17.717453 0 31.994625 14.277171 31.994625 31.994625l0 351.94087C447.924744 753.593818 433.647573 768.043004 415.930119 768.043004z"
                        fill="currentColor"
                      ></path>
                      <path
                        d="M928.016126 223.962372l-159.973123 0L768.043004 159.973123c0-52.980346-42.659499-95.983874-95.295817-95.983874L351.94087 63.989249c-52.980346 0-95.983874 43.003528-95.983874 95.983874l0 63.989249-159.973123 0c-17.717453 0-31.994625 14.277171-31.994625 31.994625s14.277171 31.994625 31.994625 31.994625l832.032253 0c17.717453 0 31.994625-14.277171 31.994625-31.994625S945.73358 223.962372 928.016126 223.962372zM319.946246 159.973123c0-17.545439 14.449185-31.994625 31.994625-31.994625l320.806316 0c17.545439 0 31.306568 14.105157 31.306568 31.994625l0 63.989249L319.946246 223.962372 319.946246 159.973123 319.946246 159.973123z"
                        fill="currentColor"
                      ></path>
                      <path
                        d="M736.048379 960.010751 288.123635 960.010751c-52.980346 0-95.983874-43.003528-95.983874-95.983874L192.139761 383.591466c0-17.717453 14.277171-31.994625 31.994625-31.994625s31.994625 14.277171 31.994625 31.994625l0 480.435411c0 17.717453 14.449185 31.994625 31.994625 31.994625l448.096758 0c17.717453 0 31.994625-14.277171 31.994625-31.994625L768.215018 384.795565c0-17.717453 14.277171-31.994625 31.994625-31.994625s31.994625 14.277171 31.994625 31.994625l0 479.231312C832.032253 916.835209 789.028725 960.010751 736.048379 960.010751z"
                        fill="currentColor"
                      ></path>
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};
export default FileList;

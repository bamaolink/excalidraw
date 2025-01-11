import React, { forwardRef, useImperativeHandle, useState } from "react";
import type { ForwardRefRenderFunction } from "react";
import "./Signin.scss";
import { signin } from "./Apis";
import Toast from "./Toast";
import type { ItemToast, AddToast, RemoveToast } from "./Toast";
import { excalidrawUserTokenKey, excalidrawUserNameKey } from "./HttpClient";

export interface SigninProps {
  onLogin: (user: any) => void;
  onLogout?: () => void;
}

export interface SigninImperativeHandleType {
  addToast: AddToast;
  removeToast: RemoveToast;
}

const Signin: ForwardRefRenderFunction<
  SigninImperativeHandleType,
  SigninProps
> = ({ onLogin }, forwardedRef) => {
  const [toasts, setToasts] = useState<ItemToast[]>([]);

  const addToast: AddToast = (message, type) => {
    const newToast = { id: Date.now(), message, type };
    setToasts((prev) => [...prev, newToast]);
  };

  const removeToast: RemoveToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };
  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    if (!email || !password) {
      addToast("请输入邮箱和密码", "error");
      return false;
    }
    signin({
      email,
      password,
    }).then((data) => {
      if (+data.code !== 0) {
        addToast(data.msg, "error");
      } else {
        localStorage.setItem(excalidrawUserTokenKey, data.data.token);
        localStorage.setItem(excalidrawUserNameKey, data.data.name);
        onLogin(data.data);
      }
    });
  };

  useImperativeHandle(forwardedRef, () => ({
    addToast,
    removeToast,
  }));
  return (
    <div className="excalidraw-user-login">
      <div className="form-container sign-up-container">
        <form className="form" onSubmit={onSubmit}>
          <h2>用户登录</h2>
          {toasts.map((toast) => (
            <Toast
              key={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={() => removeToast(toast.id)}
            />
          ))}
          <input
            className="input-text"
            type="email"
            name="email"
            placeholder="电子邮箱"
            autoComplete="off"
          />
          <input
            className="input-text"
            type="password"
            name="password"
            placeholder="登录密码"
            autoComplete="off"
          />
          <button type="submit" className="sign-up">
            点击登录
          </button>
        </form>
      </div>
    </div>
  );
};

export default forwardRef(Signin);

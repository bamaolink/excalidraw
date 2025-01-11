import httpClient from "./HttpClient";

export interface IResponseType<T> {
  code: number;
  msg: string;
  data: T;
}

export interface UserInfoType {
  email: string;
  token: string;
  expired: string;
  name: string;
  avatar: string;
}

export interface FileType {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  isEditing: boolean;
  disabled: boolean;
}

export const signin = async (postData: { email: string; password: string }) => {
  const res = await httpClient.post<IResponseType<UserInfoType>>(
    "/user/signin",
    postData,
  );
  return res;
};

export const signout = async () => {
  const res = await httpClient.get<IResponseType<null>>("/user/signout");
  return res;
};

export const getUserInfo = async () => {
  const res = await httpClient.get<IResponseType<UserInfoType>>("/user/info");
  return res.data;
};

export const createFile = async (
  postData: Pick<FileType, "title" | "content">,
) => {
  const res = await httpClient.post<IResponseType<FileType>>(
    "/excalidraw/create",
    postData,
  );
  return res;
};

export const updateFile = async (
  id: number,
  postData: Pick<FileType, "title" | "content">,
) => {
  const res = await httpClient.put<IResponseType<FileType>>(
    `/excalidraw/update/${id}`,
    postData,
  );
  return res;
};

export const deleteFile = async (id: number) => {
  const res = await httpClient.delete<IResponseType<FileType>>(
    `/excalidraw/delete/${id}`,
  );
  return res;
};

export const allFiles = async () => {
  const res = await httpClient.get<IResponseType<Array<FileType>>>(
    `/excalidraw/all`,
  );
  return res;
};

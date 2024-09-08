import express from "express";

type PathParams<Req> = Req extends { $path: infer P } ? P : never;

type QueryParams<Req> = Req extends { $query: infer Q } ? Q : never;

type RequestBody<Req> = Req extends { $body: infer B } ? B : never;

type ResponseBody<Res> = Res extends { $content: { $body: infer B } } ? B : never;

type Handler<Fn> = Fn extends (params: infer Req) => infer Res
  ? express.RequestHandler<PathParams<Req>, ResponseBody<Res>, RequestBody<Req>, QueryParams<Req>>
  : never;

type PathsWithMethod<Paths extends {}, Method extends string> = {
  [Path in keyof Paths]: Paths[Path] extends { [M in Method]: unknown } ? Path : never;
}[keyof Paths & string];

type Operation<P, Method extends string> = P extends { [M in Method]: infer Op } ? Op : never;

interface App<Paths extends {}> {
  readonly express: express.Application;

  get<Path extends PathsWithMethod<Paths, "get">>(
    path: Path,
    ...handlers: Handler<Operation<Paths[Path], "get">>[]
  ): App<Paths>;
  post<Path extends PathsWithMethod<Paths, "post">>(
    path: Path,
    ...handlers: Handler<Operation<Paths[Path], "post">>[]
  ): App<Paths>;
  put<Path extends PathsWithMethod<Paths, "put">>(
    path: Path,
    ...handlers: Handler<Operation<Paths[Path], "put">>[]
  ): App<Paths>;
  patch<Path extends PathsWithMethod<Paths, "patch">>(
    path: Path,
    ...handlers: Handler<Operation<Paths[Path], "patch">>[]
  ): App<Paths>;
  delete<Path extends PathsWithMethod<Paths, "delete">>(
    path: Path,
    ...handlers: Handler<Operation<Paths[Path], "delete">>[]
  ): App<Paths>;
}

const replacePathParams = (path: string) => path.replaceAll(/\{(\w+)}/g, ":$1");

export function createExpress<Paths extends {}>(): App<Paths> {
  const _express = express();

  const app: App<Paths> = {
    express: _express,
    get: (path, handler) => {
      _express.get(replacePathParams(path), handler);
      return app;
    },
    post: (path, handler) => {
      _express.post(replacePathParams(path), handler);
      return app;
    },
    put: (path, handler) => {
      _express.put(replacePathParams(path), handler);
      return app;
    },
    patch: (path, handler) => {
      _express.patch(replacePathParams(path), handler);
      return app;
    },
    delete: (path, handler) => {
      _express.delete(replacePathParams(path), handler);
      return app;
    },
  };

  return app;
}

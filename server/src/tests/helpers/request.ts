import request from "supertest";

import app from "../../app";

export class RequestHelper {
  static get(url: string, token?: string) {
    const req = request(app).get(url);

    if (token) {
      req.set("Authorization", `Bearer ${token}`);
    }

    return req;
  }

  static post<T extends object>(url: string, body?: T, token?: string) {
    const req = request(app).post(url);

    if (token) {
      req.set("Authorization", `Bearer ${token}`);
    }

    return req.send(body);
  }
  static put<T extends object>(url: string, body?: T, token?: string) {
    const req = request(app).put(url);

    if (token) {
      req.set("Authorization", `Bearer ${token}`);
    }

    return req.send(body);
  }

  static patch<T extends object>(url: string, body?: T, token?: string) {
    const req = request(app).patch(url);

    if (token) {
      req.set("Authorization", `Bearer ${token}`);
    }

    return req.send(body);
  }

  static delete(url: string, token?: string) {
    const req = request(app).delete(url);

    if (token) {
      req.set("Authorization", `Bearer ${token}`);
    }

    return req;
  }
}

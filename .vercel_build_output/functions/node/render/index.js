var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __markAsModule = (target) => __defProp(target, "__esModule", { value: true });
var __esm = (fn, res) => function __init() {
  return fn && (res = (0, fn[Object.keys(fn)[0]])(fn = 0)), res;
};
var __export = (target, all) => {
  __markAsModule(target);
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __reExport = (target, module2, desc) => {
  if (module2 && typeof module2 === "object" || typeof module2 === "function") {
    for (let key of __getOwnPropNames(module2))
      if (!__hasOwnProp.call(target, key) && key !== "default")
        __defProp(target, key, { get: () => module2[key], enumerable: !(desc = __getOwnPropDesc(module2, key)) || desc.enumerable });
  }
  return target;
};
var __toModule = (module2) => {
  return __reExport(__markAsModule(__defProp(module2 != null ? __create(__getProtoOf(module2)) : {}, "default", module2 && module2.__esModule && "default" in module2 ? { get: () => module2.default, enumerable: true } : { value: module2, enumerable: true })), module2);
};

// node_modules/@sveltejs/kit/dist/install-fetch.js
function dataUriToBuffer(uri) {
  if (!/^data:/i.test(uri)) {
    throw new TypeError('`uri` does not appear to be a Data URI (must begin with "data:")');
  }
  uri = uri.replace(/\r?\n/g, "");
  const firstComma = uri.indexOf(",");
  if (firstComma === -1 || firstComma <= 4) {
    throw new TypeError("malformed data: URI");
  }
  const meta = uri.substring(5, firstComma).split(";");
  let charset = "";
  let base64 = false;
  const type = meta[0] || "text/plain";
  let typeFull = type;
  for (let i = 1; i < meta.length; i++) {
    if (meta[i] === "base64") {
      base64 = true;
    } else {
      typeFull += `;${meta[i]}`;
      if (meta[i].indexOf("charset=") === 0) {
        charset = meta[i].substring(8);
      }
    }
  }
  if (!meta[0] && !charset.length) {
    typeFull += ";charset=US-ASCII";
    charset = "US-ASCII";
  }
  const encoding = base64 ? "base64" : "ascii";
  const data = unescape(uri.substring(firstComma + 1));
  const buffer = Buffer.from(data, encoding);
  buffer.type = type;
  buffer.typeFull = typeFull;
  buffer.charset = charset;
  return buffer;
}
async function* toIterator(parts, clone2 = true) {
  for (const part of parts) {
    if ("stream" in part) {
      yield* part.stream();
    } else if (ArrayBuffer.isView(part)) {
      if (clone2) {
        let position = part.byteOffset;
        const end = part.byteOffset + part.byteLength;
        while (position !== end) {
          const size = Math.min(end - position, POOL_SIZE);
          const chunk = part.buffer.slice(position, position + size);
          position += chunk.byteLength;
          yield new Uint8Array(chunk);
        }
      } else {
        yield part;
      }
    } else {
      let position = 0;
      while (position !== part.size) {
        const chunk = part.slice(position, Math.min(part.size, position + POOL_SIZE));
        const buffer = await chunk.arrayBuffer();
        position += buffer.byteLength;
        yield new Uint8Array(buffer);
      }
    }
  }
}
function isFormData(object) {
  return typeof object === "object" && typeof object.append === "function" && typeof object.set === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.delete === "function" && typeof object.keys === "function" && typeof object.values === "function" && typeof object.entries === "function" && typeof object.constructor === "function" && object[NAME] === "FormData";
}
function getHeader(boundary, name, field) {
  let header = "";
  header += `${dashes}${boundary}${carriage}`;
  header += `Content-Disposition: form-data; name="${name}"`;
  if (isBlob(field)) {
    header += `; filename="${field.name}"${carriage}`;
    header += `Content-Type: ${field.type || "application/octet-stream"}`;
  }
  return `${header}${carriage.repeat(2)}`;
}
async function* formDataIterator(form, boundary) {
  for (const [name, value] of form) {
    yield getHeader(boundary, name, value);
    if (isBlob(value)) {
      yield* value.stream();
    } else {
      yield value;
    }
    yield carriage;
  }
  yield getFooter(boundary);
}
function getFormDataLength(form, boundary) {
  let length = 0;
  for (const [name, value] of form) {
    length += Buffer.byteLength(getHeader(boundary, name, value));
    length += isBlob(value) ? value.size : Buffer.byteLength(String(value));
    length += carriageLength;
  }
  length += Buffer.byteLength(getFooter(boundary));
  return length;
}
async function consumeBody(data) {
  if (data[INTERNALS$2].disturbed) {
    throw new TypeError(`body used already for: ${data.url}`);
  }
  data[INTERNALS$2].disturbed = true;
  if (data[INTERNALS$2].error) {
    throw data[INTERNALS$2].error;
  }
  let { body } = data;
  if (body === null) {
    return Buffer.alloc(0);
  }
  if (isBlob(body)) {
    body = import_stream.default.Readable.from(body.stream());
  }
  if (Buffer.isBuffer(body)) {
    return body;
  }
  if (!(body instanceof import_stream.default)) {
    return Buffer.alloc(0);
  }
  const accum = [];
  let accumBytes = 0;
  try {
    for await (const chunk of body) {
      if (data.size > 0 && accumBytes + chunk.length > data.size) {
        const error2 = new FetchError(`content size at ${data.url} over limit: ${data.size}`, "max-size");
        body.destroy(error2);
        throw error2;
      }
      accumBytes += chunk.length;
      accum.push(chunk);
    }
  } catch (error2) {
    const error_ = error2 instanceof FetchBaseError ? error2 : new FetchError(`Invalid response body while trying to fetch ${data.url}: ${error2.message}`, "system", error2);
    throw error_;
  }
  if (body.readableEnded === true || body._readableState.ended === true) {
    try {
      if (accum.every((c) => typeof c === "string")) {
        return Buffer.from(accum.join(""));
      }
      return Buffer.concat(accum, accumBytes);
    } catch (error2) {
      throw new FetchError(`Could not create Buffer from response body for ${data.url}: ${error2.message}`, "system", error2);
    }
  } else {
    throw new FetchError(`Premature close of server response while trying to fetch ${data.url}`);
  }
}
function fromRawHeaders(headers = []) {
  return new Headers(headers.reduce((result, value, index2, array) => {
    if (index2 % 2 === 0) {
      result.push(array.slice(index2, index2 + 2));
    }
    return result;
  }, []).filter(([name, value]) => {
    try {
      validateHeaderName(name);
      validateHeaderValue(name, String(value));
      return true;
    } catch {
      return false;
    }
  }));
}
async function fetch(url2, options_) {
  return new Promise((resolve2, reject) => {
    const request = new Request(url2, options_);
    const options2 = getNodeRequestOptions(request);
    if (!supportedSchemas.has(options2.protocol)) {
      throw new TypeError(`node-fetch cannot load ${url2}. URL scheme "${options2.protocol.replace(/:$/, "")}" is not supported.`);
    }
    if (options2.protocol === "data:") {
      const data = dataUriToBuffer$1(request.url);
      const response2 = new Response(data, { headers: { "Content-Type": data.typeFull } });
      resolve2(response2);
      return;
    }
    const send = (options2.protocol === "https:" ? import_https.default : import_http.default).request;
    const { signal } = request;
    let response = null;
    const abort = () => {
      const error2 = new AbortError("The operation was aborted.");
      reject(error2);
      if (request.body && request.body instanceof import_stream.default.Readable) {
        request.body.destroy(error2);
      }
      if (!response || !response.body) {
        return;
      }
      response.body.emit("error", error2);
    };
    if (signal && signal.aborted) {
      abort();
      return;
    }
    const abortAndFinalize = () => {
      abort();
      finalize();
    };
    const request_ = send(options2);
    if (signal) {
      signal.addEventListener("abort", abortAndFinalize);
    }
    const finalize = () => {
      request_.abort();
      if (signal) {
        signal.removeEventListener("abort", abortAndFinalize);
      }
    };
    request_.on("error", (error2) => {
      reject(new FetchError(`request to ${request.url} failed, reason: ${error2.message}`, "system", error2));
      finalize();
    });
    fixResponseChunkedTransferBadEnding(request_, (error2) => {
      response.body.destroy(error2);
    });
    if (process.version < "v14") {
      request_.on("socket", (s2) => {
        let endedWithEventsCount;
        s2.prependListener("end", () => {
          endedWithEventsCount = s2._eventsCount;
        });
        s2.prependListener("close", (hadError) => {
          if (response && endedWithEventsCount < s2._eventsCount && !hadError) {
            const error2 = new Error("Premature close");
            error2.code = "ERR_STREAM_PREMATURE_CLOSE";
            response.body.emit("error", error2);
          }
        });
      });
    }
    request_.on("response", (response_) => {
      request_.setTimeout(0);
      const headers = fromRawHeaders(response_.rawHeaders);
      if (isRedirect(response_.statusCode)) {
        const location = headers.get("Location");
        const locationURL = location === null ? null : new URL(location, request.url);
        switch (request.redirect) {
          case "error":
            reject(new FetchError(`uri requested responds with a redirect, redirect mode is set to error: ${request.url}`, "no-redirect"));
            finalize();
            return;
          case "manual":
            if (locationURL !== null) {
              headers.set("Location", locationURL);
            }
            break;
          case "follow": {
            if (locationURL === null) {
              break;
            }
            if (request.counter >= request.follow) {
              reject(new FetchError(`maximum redirect reached at: ${request.url}`, "max-redirect"));
              finalize();
              return;
            }
            const requestOptions = {
              headers: new Headers(request.headers),
              follow: request.follow,
              counter: request.counter + 1,
              agent: request.agent,
              compress: request.compress,
              method: request.method,
              body: request.body,
              signal: request.signal,
              size: request.size
            };
            if (response_.statusCode !== 303 && request.body && options_.body instanceof import_stream.default.Readable) {
              reject(new FetchError("Cannot follow redirect with body being a readable stream", "unsupported-redirect"));
              finalize();
              return;
            }
            if (response_.statusCode === 303 || (response_.statusCode === 301 || response_.statusCode === 302) && request.method === "POST") {
              requestOptions.method = "GET";
              requestOptions.body = void 0;
              requestOptions.headers.delete("content-length");
            }
            resolve2(fetch(new Request(locationURL, requestOptions)));
            finalize();
            return;
          }
          default:
            return reject(new TypeError(`Redirect option '${request.redirect}' is not a valid value of RequestRedirect`));
        }
      }
      if (signal) {
        response_.once("end", () => {
          signal.removeEventListener("abort", abortAndFinalize);
        });
      }
      let body = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), reject);
      if (process.version < "v12.10") {
        response_.on("aborted", abortAndFinalize);
      }
      const responseOptions = {
        url: request.url,
        status: response_.statusCode,
        statusText: response_.statusMessage,
        headers,
        size: request.size,
        counter: request.counter,
        highWaterMark: request.highWaterMark
      };
      const codings = headers.get("Content-Encoding");
      if (!request.compress || request.method === "HEAD" || codings === null || response_.statusCode === 204 || response_.statusCode === 304) {
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      const zlibOptions = {
        flush: import_zlib.default.Z_SYNC_FLUSH,
        finishFlush: import_zlib.default.Z_SYNC_FLUSH
      };
      if (codings === "gzip" || codings === "x-gzip") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createGunzip(zlibOptions), reject);
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      if (codings === "deflate" || codings === "x-deflate") {
        const raw = (0, import_stream.pipeline)(response_, new import_stream.PassThrough(), reject);
        raw.once("data", (chunk) => {
          body = (chunk[0] & 15) === 8 ? (0, import_stream.pipeline)(body, import_zlib.default.createInflate(), reject) : (0, import_stream.pipeline)(body, import_zlib.default.createInflateRaw(), reject);
          response = new Response(body, responseOptions);
          resolve2(response);
        });
        return;
      }
      if (codings === "br") {
        body = (0, import_stream.pipeline)(body, import_zlib.default.createBrotliDecompress(), reject);
        response = new Response(body, responseOptions);
        resolve2(response);
        return;
      }
      response = new Response(body, responseOptions);
      resolve2(response);
    });
    writeToStream(request_, request);
  });
}
function fixResponseChunkedTransferBadEnding(request, errorCallback) {
  const LAST_CHUNK = Buffer.from("0\r\n\r\n");
  let isChunkedTransfer = false;
  let properLastChunkReceived = false;
  let previousChunk;
  request.on("response", (response) => {
    const { headers } = response;
    isChunkedTransfer = headers["transfer-encoding"] === "chunked" && !headers["content-length"];
  });
  request.on("socket", (socket) => {
    const onSocketClose = () => {
      if (isChunkedTransfer && !properLastChunkReceived) {
        const error2 = new Error("Premature close");
        error2.code = "ERR_STREAM_PREMATURE_CLOSE";
        errorCallback(error2);
      }
    };
    socket.prependListener("close", onSocketClose);
    request.on("abort", () => {
      socket.removeListener("close", onSocketClose);
    });
    socket.on("data", (buf) => {
      properLastChunkReceived = Buffer.compare(buf.slice(-5), LAST_CHUNK) === 0;
      if (!properLastChunkReceived && previousChunk) {
        properLastChunkReceived = Buffer.compare(previousChunk.slice(-3), LAST_CHUNK.slice(0, 3)) === 0 && Buffer.compare(buf.slice(-2), LAST_CHUNK.slice(3)) === 0;
      }
      previousChunk = buf;
    });
  });
}
var import_http, import_https, import_zlib, import_stream, import_util, import_crypto, import_url, commonjsGlobal, src, dataUriToBuffer$1, ponyfill_es2018, POOL_SIZE$1, POOL_SIZE, _Blob, Blob2, Blob$1, FetchBaseError, FetchError, NAME, isURLSearchParameters, isBlob, isAbortSignal, carriage, dashes, carriageLength, getFooter, getBoundary, INTERNALS$2, Body, clone, extractContentType, getTotalBytes, writeToStream, validateHeaderName, validateHeaderValue, Headers, redirectStatus, isRedirect, INTERNALS$1, Response, getSearch, INTERNALS, isRequest, Request, getNodeRequestOptions, AbortError, supportedSchemas;
var init_install_fetch = __esm({
  "node_modules/@sveltejs/kit/dist/install-fetch.js"() {
    init_shims();
    import_http = __toModule(require("http"));
    import_https = __toModule(require("https"));
    import_zlib = __toModule(require("zlib"));
    import_stream = __toModule(require("stream"));
    import_util = __toModule(require("util"));
    import_crypto = __toModule(require("crypto"));
    import_url = __toModule(require("url"));
    commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
    src = dataUriToBuffer;
    dataUriToBuffer$1 = src;
    ponyfill_es2018 = { exports: {} };
    (function(module2, exports) {
      (function(global2, factory) {
        factory(exports);
      })(commonjsGlobal, function(exports2) {
        const SymbolPolyfill = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? Symbol : (description) => `Symbol(${description})`;
        function noop2() {
          return void 0;
        }
        function getGlobals() {
          if (typeof self !== "undefined") {
            return self;
          } else if (typeof window !== "undefined") {
            return window;
          } else if (typeof commonjsGlobal !== "undefined") {
            return commonjsGlobal;
          }
          return void 0;
        }
        const globals = getGlobals();
        function typeIsObject(x) {
          return typeof x === "object" && x !== null || typeof x === "function";
        }
        const rethrowAssertionErrorRejection = noop2;
        const originalPromise = Promise;
        const originalPromiseThen = Promise.prototype.then;
        const originalPromiseResolve = Promise.resolve.bind(originalPromise);
        const originalPromiseReject = Promise.reject.bind(originalPromise);
        function newPromise(executor) {
          return new originalPromise(executor);
        }
        function promiseResolvedWith(value) {
          return originalPromiseResolve(value);
        }
        function promiseRejectedWith(reason) {
          return originalPromiseReject(reason);
        }
        function PerformPromiseThen(promise, onFulfilled, onRejected) {
          return originalPromiseThen.call(promise, onFulfilled, onRejected);
        }
        function uponPromise(promise, onFulfilled, onRejected) {
          PerformPromiseThen(PerformPromiseThen(promise, onFulfilled, onRejected), void 0, rethrowAssertionErrorRejection);
        }
        function uponFulfillment(promise, onFulfilled) {
          uponPromise(promise, onFulfilled);
        }
        function uponRejection(promise, onRejected) {
          uponPromise(promise, void 0, onRejected);
        }
        function transformPromiseWith(promise, fulfillmentHandler, rejectionHandler) {
          return PerformPromiseThen(promise, fulfillmentHandler, rejectionHandler);
        }
        function setPromiseIsHandledToTrue(promise) {
          PerformPromiseThen(promise, void 0, rethrowAssertionErrorRejection);
        }
        const queueMicrotask = (() => {
          const globalQueueMicrotask = globals && globals.queueMicrotask;
          if (typeof globalQueueMicrotask === "function") {
            return globalQueueMicrotask;
          }
          const resolvedPromise = promiseResolvedWith(void 0);
          return (fn) => PerformPromiseThen(resolvedPromise, fn);
        })();
        function reflectCall(F, V, args) {
          if (typeof F !== "function") {
            throw new TypeError("Argument is not a function");
          }
          return Function.prototype.apply.call(F, V, args);
        }
        function promiseCall(F, V, args) {
          try {
            return promiseResolvedWith(reflectCall(F, V, args));
          } catch (value) {
            return promiseRejectedWith(value);
          }
        }
        const QUEUE_MAX_ARRAY_SIZE = 16384;
        class SimpleQueue {
          constructor() {
            this._cursor = 0;
            this._size = 0;
            this._front = {
              _elements: [],
              _next: void 0
            };
            this._back = this._front;
            this._cursor = 0;
            this._size = 0;
          }
          get length() {
            return this._size;
          }
          push(element) {
            const oldBack = this._back;
            let newBack = oldBack;
            if (oldBack._elements.length === QUEUE_MAX_ARRAY_SIZE - 1) {
              newBack = {
                _elements: [],
                _next: void 0
              };
            }
            oldBack._elements.push(element);
            if (newBack !== oldBack) {
              this._back = newBack;
              oldBack._next = newBack;
            }
            ++this._size;
          }
          shift() {
            const oldFront = this._front;
            let newFront = oldFront;
            const oldCursor = this._cursor;
            let newCursor = oldCursor + 1;
            const elements = oldFront._elements;
            const element = elements[oldCursor];
            if (newCursor === QUEUE_MAX_ARRAY_SIZE) {
              newFront = oldFront._next;
              newCursor = 0;
            }
            --this._size;
            this._cursor = newCursor;
            if (oldFront !== newFront) {
              this._front = newFront;
            }
            elements[oldCursor] = void 0;
            return element;
          }
          forEach(callback) {
            let i = this._cursor;
            let node = this._front;
            let elements = node._elements;
            while (i !== elements.length || node._next !== void 0) {
              if (i === elements.length) {
                node = node._next;
                elements = node._elements;
                i = 0;
                if (elements.length === 0) {
                  break;
                }
              }
              callback(elements[i]);
              ++i;
            }
          }
          peek() {
            const front = this._front;
            const cursor = this._cursor;
            return front._elements[cursor];
          }
        }
        function ReadableStreamReaderGenericInitialize(reader, stream) {
          reader._ownerReadableStream = stream;
          stream._reader = reader;
          if (stream._state === "readable") {
            defaultReaderClosedPromiseInitialize(reader);
          } else if (stream._state === "closed") {
            defaultReaderClosedPromiseInitializeAsResolved(reader);
          } else {
            defaultReaderClosedPromiseInitializeAsRejected(reader, stream._storedError);
          }
        }
        function ReadableStreamReaderGenericCancel(reader, reason) {
          const stream = reader._ownerReadableStream;
          return ReadableStreamCancel(stream, reason);
        }
        function ReadableStreamReaderGenericRelease(reader) {
          if (reader._ownerReadableStream._state === "readable") {
            defaultReaderClosedPromiseReject(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
          } else {
            defaultReaderClosedPromiseResetToRejected(reader, new TypeError(`Reader was released and can no longer be used to monitor the stream's closedness`));
          }
          reader._ownerReadableStream._reader = void 0;
          reader._ownerReadableStream = void 0;
        }
        function readerLockException(name) {
          return new TypeError("Cannot " + name + " a stream using a released reader");
        }
        function defaultReaderClosedPromiseInitialize(reader) {
          reader._closedPromise = newPromise((resolve2, reject) => {
            reader._closedPromise_resolve = resolve2;
            reader._closedPromise_reject = reject;
          });
        }
        function defaultReaderClosedPromiseInitializeAsRejected(reader, reason) {
          defaultReaderClosedPromiseInitialize(reader);
          defaultReaderClosedPromiseReject(reader, reason);
        }
        function defaultReaderClosedPromiseInitializeAsResolved(reader) {
          defaultReaderClosedPromiseInitialize(reader);
          defaultReaderClosedPromiseResolve(reader);
        }
        function defaultReaderClosedPromiseReject(reader, reason) {
          if (reader._closedPromise_reject === void 0) {
            return;
          }
          setPromiseIsHandledToTrue(reader._closedPromise);
          reader._closedPromise_reject(reason);
          reader._closedPromise_resolve = void 0;
          reader._closedPromise_reject = void 0;
        }
        function defaultReaderClosedPromiseResetToRejected(reader, reason) {
          defaultReaderClosedPromiseInitializeAsRejected(reader, reason);
        }
        function defaultReaderClosedPromiseResolve(reader) {
          if (reader._closedPromise_resolve === void 0) {
            return;
          }
          reader._closedPromise_resolve(void 0);
          reader._closedPromise_resolve = void 0;
          reader._closedPromise_reject = void 0;
        }
        const AbortSteps = SymbolPolyfill("[[AbortSteps]]");
        const ErrorSteps = SymbolPolyfill("[[ErrorSteps]]");
        const CancelSteps = SymbolPolyfill("[[CancelSteps]]");
        const PullSteps = SymbolPolyfill("[[PullSteps]]");
        const NumberIsFinite = Number.isFinite || function(x) {
          return typeof x === "number" && isFinite(x);
        };
        const MathTrunc = Math.trunc || function(v) {
          return v < 0 ? Math.ceil(v) : Math.floor(v);
        };
        function isDictionary(x) {
          return typeof x === "object" || typeof x === "function";
        }
        function assertDictionary(obj, context) {
          if (obj !== void 0 && !isDictionary(obj)) {
            throw new TypeError(`${context} is not an object.`);
          }
        }
        function assertFunction(x, context) {
          if (typeof x !== "function") {
            throw new TypeError(`${context} is not a function.`);
          }
        }
        function isObject2(x) {
          return typeof x === "object" && x !== null || typeof x === "function";
        }
        function assertObject(x, context) {
          if (!isObject2(x)) {
            throw new TypeError(`${context} is not an object.`);
          }
        }
        function assertRequiredArgument(x, position, context) {
          if (x === void 0) {
            throw new TypeError(`Parameter ${position} is required in '${context}'.`);
          }
        }
        function assertRequiredField(x, field, context) {
          if (x === void 0) {
            throw new TypeError(`${field} is required in '${context}'.`);
          }
        }
        function convertUnrestrictedDouble(value) {
          return Number(value);
        }
        function censorNegativeZero(x) {
          return x === 0 ? 0 : x;
        }
        function integerPart(x) {
          return censorNegativeZero(MathTrunc(x));
        }
        function convertUnsignedLongLongWithEnforceRange(value, context) {
          const lowerBound = 0;
          const upperBound = Number.MAX_SAFE_INTEGER;
          let x = Number(value);
          x = censorNegativeZero(x);
          if (!NumberIsFinite(x)) {
            throw new TypeError(`${context} is not a finite number`);
          }
          x = integerPart(x);
          if (x < lowerBound || x > upperBound) {
            throw new TypeError(`${context} is outside the accepted range of ${lowerBound} to ${upperBound}, inclusive`);
          }
          if (!NumberIsFinite(x) || x === 0) {
            return 0;
          }
          return x;
        }
        function assertReadableStream(x, context) {
          if (!IsReadableStream(x)) {
            throw new TypeError(`${context} is not a ReadableStream.`);
          }
        }
        function AcquireReadableStreamDefaultReader(stream) {
          return new ReadableStreamDefaultReader(stream);
        }
        function ReadableStreamAddReadRequest(stream, readRequest) {
          stream._reader._readRequests.push(readRequest);
        }
        function ReadableStreamFulfillReadRequest(stream, chunk, done) {
          const reader = stream._reader;
          const readRequest = reader._readRequests.shift();
          if (done) {
            readRequest._closeSteps();
          } else {
            readRequest._chunkSteps(chunk);
          }
        }
        function ReadableStreamGetNumReadRequests(stream) {
          return stream._reader._readRequests.length;
        }
        function ReadableStreamHasDefaultReader(stream) {
          const reader = stream._reader;
          if (reader === void 0) {
            return false;
          }
          if (!IsReadableStreamDefaultReader(reader)) {
            return false;
          }
          return true;
        }
        class ReadableStreamDefaultReader {
          constructor(stream) {
            assertRequiredArgument(stream, 1, "ReadableStreamDefaultReader");
            assertReadableStream(stream, "First parameter");
            if (IsReadableStreamLocked(stream)) {
              throw new TypeError("This stream has already been locked for exclusive reading by another reader");
            }
            ReadableStreamReaderGenericInitialize(this, stream);
            this._readRequests = new SimpleQueue();
          }
          get closed() {
            if (!IsReadableStreamDefaultReader(this)) {
              return promiseRejectedWith(defaultReaderBrandCheckException("closed"));
            }
            return this._closedPromise;
          }
          cancel(reason = void 0) {
            if (!IsReadableStreamDefaultReader(this)) {
              return promiseRejectedWith(defaultReaderBrandCheckException("cancel"));
            }
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("cancel"));
            }
            return ReadableStreamReaderGenericCancel(this, reason);
          }
          read() {
            if (!IsReadableStreamDefaultReader(this)) {
              return promiseRejectedWith(defaultReaderBrandCheckException("read"));
            }
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("read from"));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve2, reject) => {
              resolvePromise = resolve2;
              rejectPromise = reject;
            });
            const readRequest = {
              _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
              _closeSteps: () => resolvePromise({ value: void 0, done: true }),
              _errorSteps: (e) => rejectPromise(e)
            };
            ReadableStreamDefaultReaderRead(this, readRequest);
            return promise;
          }
          releaseLock() {
            if (!IsReadableStreamDefaultReader(this)) {
              throw defaultReaderBrandCheckException("releaseLock");
            }
            if (this._ownerReadableStream === void 0) {
              return;
            }
            if (this._readRequests.length > 0) {
              throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled");
            }
            ReadableStreamReaderGenericRelease(this);
          }
        }
        Object.defineProperties(ReadableStreamDefaultReader.prototype, {
          cancel: { enumerable: true },
          read: { enumerable: true },
          releaseLock: { enumerable: true },
          closed: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamDefaultReader.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamDefaultReader",
            configurable: true
          });
        }
        function IsReadableStreamDefaultReader(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_readRequests")) {
            return false;
          }
          return x instanceof ReadableStreamDefaultReader;
        }
        function ReadableStreamDefaultReaderRead(reader, readRequest) {
          const stream = reader._ownerReadableStream;
          stream._disturbed = true;
          if (stream._state === "closed") {
            readRequest._closeSteps();
          } else if (stream._state === "errored") {
            readRequest._errorSteps(stream._storedError);
          } else {
            stream._readableStreamController[PullSteps](readRequest);
          }
        }
        function defaultReaderBrandCheckException(name) {
          return new TypeError(`ReadableStreamDefaultReader.prototype.${name} can only be used on a ReadableStreamDefaultReader`);
        }
        const AsyncIteratorPrototype = Object.getPrototypeOf(Object.getPrototypeOf(async function* () {
        }).prototype);
        class ReadableStreamAsyncIteratorImpl {
          constructor(reader, preventCancel) {
            this._ongoingPromise = void 0;
            this._isFinished = false;
            this._reader = reader;
            this._preventCancel = preventCancel;
          }
          next() {
            const nextSteps = () => this._nextSteps();
            this._ongoingPromise = this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, nextSteps, nextSteps) : nextSteps();
            return this._ongoingPromise;
          }
          return(value) {
            const returnSteps = () => this._returnSteps(value);
            return this._ongoingPromise ? transformPromiseWith(this._ongoingPromise, returnSteps, returnSteps) : returnSteps();
          }
          _nextSteps() {
            if (this._isFinished) {
              return Promise.resolve({ value: void 0, done: true });
            }
            const reader = this._reader;
            if (reader._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("iterate"));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve2, reject) => {
              resolvePromise = resolve2;
              rejectPromise = reject;
            });
            const readRequest = {
              _chunkSteps: (chunk) => {
                this._ongoingPromise = void 0;
                queueMicrotask(() => resolvePromise({ value: chunk, done: false }));
              },
              _closeSteps: () => {
                this._ongoingPromise = void 0;
                this._isFinished = true;
                ReadableStreamReaderGenericRelease(reader);
                resolvePromise({ value: void 0, done: true });
              },
              _errorSteps: (reason) => {
                this._ongoingPromise = void 0;
                this._isFinished = true;
                ReadableStreamReaderGenericRelease(reader);
                rejectPromise(reason);
              }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
            return promise;
          }
          _returnSteps(value) {
            if (this._isFinished) {
              return Promise.resolve({ value, done: true });
            }
            this._isFinished = true;
            const reader = this._reader;
            if (reader._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("finish iterating"));
            }
            if (!this._preventCancel) {
              const result = ReadableStreamReaderGenericCancel(reader, value);
              ReadableStreamReaderGenericRelease(reader);
              return transformPromiseWith(result, () => ({ value, done: true }));
            }
            ReadableStreamReaderGenericRelease(reader);
            return promiseResolvedWith({ value, done: true });
          }
        }
        const ReadableStreamAsyncIteratorPrototype = {
          next() {
            if (!IsReadableStreamAsyncIterator(this)) {
              return promiseRejectedWith(streamAsyncIteratorBrandCheckException("next"));
            }
            return this._asyncIteratorImpl.next();
          },
          return(value) {
            if (!IsReadableStreamAsyncIterator(this)) {
              return promiseRejectedWith(streamAsyncIteratorBrandCheckException("return"));
            }
            return this._asyncIteratorImpl.return(value);
          }
        };
        if (AsyncIteratorPrototype !== void 0) {
          Object.setPrototypeOf(ReadableStreamAsyncIteratorPrototype, AsyncIteratorPrototype);
        }
        function AcquireReadableStreamAsyncIterator(stream, preventCancel) {
          const reader = AcquireReadableStreamDefaultReader(stream);
          const impl = new ReadableStreamAsyncIteratorImpl(reader, preventCancel);
          const iterator = Object.create(ReadableStreamAsyncIteratorPrototype);
          iterator._asyncIteratorImpl = impl;
          return iterator;
        }
        function IsReadableStreamAsyncIterator(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_asyncIteratorImpl")) {
            return false;
          }
          try {
            return x._asyncIteratorImpl instanceof ReadableStreamAsyncIteratorImpl;
          } catch (_a) {
            return false;
          }
        }
        function streamAsyncIteratorBrandCheckException(name) {
          return new TypeError(`ReadableStreamAsyncIterator.${name} can only be used on a ReadableSteamAsyncIterator`);
        }
        const NumberIsNaN = Number.isNaN || function(x) {
          return x !== x;
        };
        function CreateArrayFromList(elements) {
          return elements.slice();
        }
        function CopyDataBlockBytes(dest, destOffset, src2, srcOffset, n) {
          new Uint8Array(dest).set(new Uint8Array(src2, srcOffset, n), destOffset);
        }
        function TransferArrayBuffer(O) {
          return O;
        }
        function IsDetachedBuffer(O) {
          return false;
        }
        function ArrayBufferSlice(buffer, begin, end) {
          if (buffer.slice) {
            return buffer.slice(begin, end);
          }
          const length = end - begin;
          const slice = new ArrayBuffer(length);
          CopyDataBlockBytes(slice, 0, buffer, begin, length);
          return slice;
        }
        function IsNonNegativeNumber(v) {
          if (typeof v !== "number") {
            return false;
          }
          if (NumberIsNaN(v)) {
            return false;
          }
          if (v < 0) {
            return false;
          }
          return true;
        }
        function CloneAsUint8Array(O) {
          const buffer = ArrayBufferSlice(O.buffer, O.byteOffset, O.byteOffset + O.byteLength);
          return new Uint8Array(buffer);
        }
        function DequeueValue(container) {
          const pair = container._queue.shift();
          container._queueTotalSize -= pair.size;
          if (container._queueTotalSize < 0) {
            container._queueTotalSize = 0;
          }
          return pair.value;
        }
        function EnqueueValueWithSize(container, value, size) {
          if (!IsNonNegativeNumber(size) || size === Infinity) {
            throw new RangeError("Size must be a finite, non-NaN, non-negative number.");
          }
          container._queue.push({ value, size });
          container._queueTotalSize += size;
        }
        function PeekQueueValue(container) {
          const pair = container._queue.peek();
          return pair.value;
        }
        function ResetQueue(container) {
          container._queue = new SimpleQueue();
          container._queueTotalSize = 0;
        }
        class ReadableStreamBYOBRequest {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get view() {
            if (!IsReadableStreamBYOBRequest(this)) {
              throw byobRequestBrandCheckException("view");
            }
            return this._view;
          }
          respond(bytesWritten) {
            if (!IsReadableStreamBYOBRequest(this)) {
              throw byobRequestBrandCheckException("respond");
            }
            assertRequiredArgument(bytesWritten, 1, "respond");
            bytesWritten = convertUnsignedLongLongWithEnforceRange(bytesWritten, "First parameter");
            if (this._associatedReadableByteStreamController === void 0) {
              throw new TypeError("This BYOB request has been invalidated");
            }
            if (IsDetachedBuffer(this._view.buffer))
              ;
            ReadableByteStreamControllerRespond(this._associatedReadableByteStreamController, bytesWritten);
          }
          respondWithNewView(view) {
            if (!IsReadableStreamBYOBRequest(this)) {
              throw byobRequestBrandCheckException("respondWithNewView");
            }
            assertRequiredArgument(view, 1, "respondWithNewView");
            if (!ArrayBuffer.isView(view)) {
              throw new TypeError("You can only respond with array buffer views");
            }
            if (this._associatedReadableByteStreamController === void 0) {
              throw new TypeError("This BYOB request has been invalidated");
            }
            if (IsDetachedBuffer(view.buffer))
              ;
            ReadableByteStreamControllerRespondWithNewView(this._associatedReadableByteStreamController, view);
          }
        }
        Object.defineProperties(ReadableStreamBYOBRequest.prototype, {
          respond: { enumerable: true },
          respondWithNewView: { enumerable: true },
          view: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamBYOBRequest.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamBYOBRequest",
            configurable: true
          });
        }
        class ReadableByteStreamController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get byobRequest() {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("byobRequest");
            }
            return ReadableByteStreamControllerGetBYOBRequest(this);
          }
          get desiredSize() {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("desiredSize");
            }
            return ReadableByteStreamControllerGetDesiredSize(this);
          }
          close() {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("close");
            }
            if (this._closeRequested) {
              throw new TypeError("The stream has already been closed; do not close it again!");
            }
            const state = this._controlledReadableByteStream._state;
            if (state !== "readable") {
              throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be closed`);
            }
            ReadableByteStreamControllerClose(this);
          }
          enqueue(chunk) {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("enqueue");
            }
            assertRequiredArgument(chunk, 1, "enqueue");
            if (!ArrayBuffer.isView(chunk)) {
              throw new TypeError("chunk must be an array buffer view");
            }
            if (chunk.byteLength === 0) {
              throw new TypeError("chunk must have non-zero byteLength");
            }
            if (chunk.buffer.byteLength === 0) {
              throw new TypeError(`chunk's buffer must have non-zero byteLength`);
            }
            if (this._closeRequested) {
              throw new TypeError("stream is closed or draining");
            }
            const state = this._controlledReadableByteStream._state;
            if (state !== "readable") {
              throw new TypeError(`The stream (in ${state} state) is not in the readable state and cannot be enqueued to`);
            }
            ReadableByteStreamControllerEnqueue(this, chunk);
          }
          error(e = void 0) {
            if (!IsReadableByteStreamController(this)) {
              throw byteStreamControllerBrandCheckException("error");
            }
            ReadableByteStreamControllerError(this, e);
          }
          [CancelSteps](reason) {
            ReadableByteStreamControllerClearPendingPullIntos(this);
            ResetQueue(this);
            const result = this._cancelAlgorithm(reason);
            ReadableByteStreamControllerClearAlgorithms(this);
            return result;
          }
          [PullSteps](readRequest) {
            const stream = this._controlledReadableByteStream;
            if (this._queueTotalSize > 0) {
              const entry = this._queue.shift();
              this._queueTotalSize -= entry.byteLength;
              ReadableByteStreamControllerHandleQueueDrain(this);
              const view = new Uint8Array(entry.buffer, entry.byteOffset, entry.byteLength);
              readRequest._chunkSteps(view);
              return;
            }
            const autoAllocateChunkSize = this._autoAllocateChunkSize;
            if (autoAllocateChunkSize !== void 0) {
              let buffer;
              try {
                buffer = new ArrayBuffer(autoAllocateChunkSize);
              } catch (bufferE) {
                readRequest._errorSteps(bufferE);
                return;
              }
              const pullIntoDescriptor = {
                buffer,
                bufferByteLength: autoAllocateChunkSize,
                byteOffset: 0,
                byteLength: autoAllocateChunkSize,
                bytesFilled: 0,
                elementSize: 1,
                viewConstructor: Uint8Array,
                readerType: "default"
              };
              this._pendingPullIntos.push(pullIntoDescriptor);
            }
            ReadableStreamAddReadRequest(stream, readRequest);
            ReadableByteStreamControllerCallPullIfNeeded(this);
          }
        }
        Object.defineProperties(ReadableByteStreamController.prototype, {
          close: { enumerable: true },
          enqueue: { enumerable: true },
          error: { enumerable: true },
          byobRequest: { enumerable: true },
          desiredSize: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableByteStreamController.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableByteStreamController",
            configurable: true
          });
        }
        function IsReadableByteStreamController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledReadableByteStream")) {
            return false;
          }
          return x instanceof ReadableByteStreamController;
        }
        function IsReadableStreamBYOBRequest(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_associatedReadableByteStreamController")) {
            return false;
          }
          return x instanceof ReadableStreamBYOBRequest;
        }
        function ReadableByteStreamControllerCallPullIfNeeded(controller) {
          const shouldPull = ReadableByteStreamControllerShouldCallPull(controller);
          if (!shouldPull) {
            return;
          }
          if (controller._pulling) {
            controller._pullAgain = true;
            return;
          }
          controller._pulling = true;
          const pullPromise = controller._pullAlgorithm();
          uponPromise(pullPromise, () => {
            controller._pulling = false;
            if (controller._pullAgain) {
              controller._pullAgain = false;
              ReadableByteStreamControllerCallPullIfNeeded(controller);
            }
          }, (e) => {
            ReadableByteStreamControllerError(controller, e);
          });
        }
        function ReadableByteStreamControllerClearPendingPullIntos(controller) {
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          controller._pendingPullIntos = new SimpleQueue();
        }
        function ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor) {
          let done = false;
          if (stream._state === "closed") {
            done = true;
          }
          const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
          if (pullIntoDescriptor.readerType === "default") {
            ReadableStreamFulfillReadRequest(stream, filledView, done);
          } else {
            ReadableStreamFulfillReadIntoRequest(stream, filledView, done);
          }
        }
        function ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor) {
          const bytesFilled = pullIntoDescriptor.bytesFilled;
          const elementSize = pullIntoDescriptor.elementSize;
          return new pullIntoDescriptor.viewConstructor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, bytesFilled / elementSize);
        }
        function ReadableByteStreamControllerEnqueueChunkToQueue(controller, buffer, byteOffset, byteLength) {
          controller._queue.push({ buffer, byteOffset, byteLength });
          controller._queueTotalSize += byteLength;
        }
        function ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor) {
          const elementSize = pullIntoDescriptor.elementSize;
          const currentAlignedBytes = pullIntoDescriptor.bytesFilled - pullIntoDescriptor.bytesFilled % elementSize;
          const maxBytesToCopy = Math.min(controller._queueTotalSize, pullIntoDescriptor.byteLength - pullIntoDescriptor.bytesFilled);
          const maxBytesFilled = pullIntoDescriptor.bytesFilled + maxBytesToCopy;
          const maxAlignedBytes = maxBytesFilled - maxBytesFilled % elementSize;
          let totalBytesToCopyRemaining = maxBytesToCopy;
          let ready = false;
          if (maxAlignedBytes > currentAlignedBytes) {
            totalBytesToCopyRemaining = maxAlignedBytes - pullIntoDescriptor.bytesFilled;
            ready = true;
          }
          const queue = controller._queue;
          while (totalBytesToCopyRemaining > 0) {
            const headOfQueue = queue.peek();
            const bytesToCopy = Math.min(totalBytesToCopyRemaining, headOfQueue.byteLength);
            const destStart = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
            CopyDataBlockBytes(pullIntoDescriptor.buffer, destStart, headOfQueue.buffer, headOfQueue.byteOffset, bytesToCopy);
            if (headOfQueue.byteLength === bytesToCopy) {
              queue.shift();
            } else {
              headOfQueue.byteOffset += bytesToCopy;
              headOfQueue.byteLength -= bytesToCopy;
            }
            controller._queueTotalSize -= bytesToCopy;
            ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesToCopy, pullIntoDescriptor);
            totalBytesToCopyRemaining -= bytesToCopy;
          }
          return ready;
        }
        function ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, size, pullIntoDescriptor) {
          pullIntoDescriptor.bytesFilled += size;
        }
        function ReadableByteStreamControllerHandleQueueDrain(controller) {
          if (controller._queueTotalSize === 0 && controller._closeRequested) {
            ReadableByteStreamControllerClearAlgorithms(controller);
            ReadableStreamClose(controller._controlledReadableByteStream);
          } else {
            ReadableByteStreamControllerCallPullIfNeeded(controller);
          }
        }
        function ReadableByteStreamControllerInvalidateBYOBRequest(controller) {
          if (controller._byobRequest === null) {
            return;
          }
          controller._byobRequest._associatedReadableByteStreamController = void 0;
          controller._byobRequest._view = null;
          controller._byobRequest = null;
        }
        function ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller) {
          while (controller._pendingPullIntos.length > 0) {
            if (controller._queueTotalSize === 0) {
              return;
            }
            const pullIntoDescriptor = controller._pendingPullIntos.peek();
            if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
              ReadableByteStreamControllerShiftPendingPullInto(controller);
              ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
            }
          }
        }
        function ReadableByteStreamControllerPullInto(controller, view, readIntoRequest) {
          const stream = controller._controlledReadableByteStream;
          let elementSize = 1;
          if (view.constructor !== DataView) {
            elementSize = view.constructor.BYTES_PER_ELEMENT;
          }
          const ctor = view.constructor;
          const buffer = TransferArrayBuffer(view.buffer);
          const pullIntoDescriptor = {
            buffer,
            bufferByteLength: buffer.byteLength,
            byteOffset: view.byteOffset,
            byteLength: view.byteLength,
            bytesFilled: 0,
            elementSize,
            viewConstructor: ctor,
            readerType: "byob"
          };
          if (controller._pendingPullIntos.length > 0) {
            controller._pendingPullIntos.push(pullIntoDescriptor);
            ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
            return;
          }
          if (stream._state === "closed") {
            const emptyView = new ctor(pullIntoDescriptor.buffer, pullIntoDescriptor.byteOffset, 0);
            readIntoRequest._closeSteps(emptyView);
            return;
          }
          if (controller._queueTotalSize > 0) {
            if (ReadableByteStreamControllerFillPullIntoDescriptorFromQueue(controller, pullIntoDescriptor)) {
              const filledView = ReadableByteStreamControllerConvertPullIntoDescriptor(pullIntoDescriptor);
              ReadableByteStreamControllerHandleQueueDrain(controller);
              readIntoRequest._chunkSteps(filledView);
              return;
            }
            if (controller._closeRequested) {
              const e = new TypeError("Insufficient bytes to fill elements in the given buffer");
              ReadableByteStreamControllerError(controller, e);
              readIntoRequest._errorSteps(e);
              return;
            }
          }
          controller._pendingPullIntos.push(pullIntoDescriptor);
          ReadableStreamAddReadIntoRequest(stream, readIntoRequest);
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
        function ReadableByteStreamControllerRespondInClosedState(controller, firstDescriptor) {
          const stream = controller._controlledReadableByteStream;
          if (ReadableStreamHasBYOBReader(stream)) {
            while (ReadableStreamGetNumReadIntoRequests(stream) > 0) {
              const pullIntoDescriptor = ReadableByteStreamControllerShiftPendingPullInto(controller);
              ReadableByteStreamControllerCommitPullIntoDescriptor(stream, pullIntoDescriptor);
            }
          }
        }
        function ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, pullIntoDescriptor) {
          ReadableByteStreamControllerFillHeadPullIntoDescriptor(controller, bytesWritten, pullIntoDescriptor);
          if (pullIntoDescriptor.bytesFilled < pullIntoDescriptor.elementSize) {
            return;
          }
          ReadableByteStreamControllerShiftPendingPullInto(controller);
          const remainderSize = pullIntoDescriptor.bytesFilled % pullIntoDescriptor.elementSize;
          if (remainderSize > 0) {
            const end = pullIntoDescriptor.byteOffset + pullIntoDescriptor.bytesFilled;
            const remainder = ArrayBufferSlice(pullIntoDescriptor.buffer, end - remainderSize, end);
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, remainder, 0, remainder.byteLength);
          }
          pullIntoDescriptor.bytesFilled -= remainderSize;
          ReadableByteStreamControllerCommitPullIntoDescriptor(controller._controlledReadableByteStream, pullIntoDescriptor);
          ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
        }
        function ReadableByteStreamControllerRespondInternal(controller, bytesWritten) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          const state = controller._controlledReadableByteStream._state;
          if (state === "closed") {
            ReadableByteStreamControllerRespondInClosedState(controller);
          } else {
            ReadableByteStreamControllerRespondInReadableState(controller, bytesWritten, firstDescriptor);
          }
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
        function ReadableByteStreamControllerShiftPendingPullInto(controller) {
          const descriptor = controller._pendingPullIntos.shift();
          return descriptor;
        }
        function ReadableByteStreamControllerShouldCallPull(controller) {
          const stream = controller._controlledReadableByteStream;
          if (stream._state !== "readable") {
            return false;
          }
          if (controller._closeRequested) {
            return false;
          }
          if (!controller._started) {
            return false;
          }
          if (ReadableStreamHasDefaultReader(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            return true;
          }
          if (ReadableStreamHasBYOBReader(stream) && ReadableStreamGetNumReadIntoRequests(stream) > 0) {
            return true;
          }
          const desiredSize = ReadableByteStreamControllerGetDesiredSize(controller);
          if (desiredSize > 0) {
            return true;
          }
          return false;
        }
        function ReadableByteStreamControllerClearAlgorithms(controller) {
          controller._pullAlgorithm = void 0;
          controller._cancelAlgorithm = void 0;
        }
        function ReadableByteStreamControllerClose(controller) {
          const stream = controller._controlledReadableByteStream;
          if (controller._closeRequested || stream._state !== "readable") {
            return;
          }
          if (controller._queueTotalSize > 0) {
            controller._closeRequested = true;
            return;
          }
          if (controller._pendingPullIntos.length > 0) {
            const firstPendingPullInto = controller._pendingPullIntos.peek();
            if (firstPendingPullInto.bytesFilled > 0) {
              const e = new TypeError("Insufficient bytes to fill elements in the given buffer");
              ReadableByteStreamControllerError(controller, e);
              throw e;
            }
          }
          ReadableByteStreamControllerClearAlgorithms(controller);
          ReadableStreamClose(stream);
        }
        function ReadableByteStreamControllerEnqueue(controller, chunk) {
          const stream = controller._controlledReadableByteStream;
          if (controller._closeRequested || stream._state !== "readable") {
            return;
          }
          const buffer = chunk.buffer;
          const byteOffset = chunk.byteOffset;
          const byteLength = chunk.byteLength;
          const transferredBuffer = TransferArrayBuffer(buffer);
          if (controller._pendingPullIntos.length > 0) {
            const firstPendingPullInto = controller._pendingPullIntos.peek();
            if (IsDetachedBuffer(firstPendingPullInto.buffer))
              ;
            firstPendingPullInto.buffer = TransferArrayBuffer(firstPendingPullInto.buffer);
          }
          ReadableByteStreamControllerInvalidateBYOBRequest(controller);
          if (ReadableStreamHasDefaultReader(stream)) {
            if (ReadableStreamGetNumReadRequests(stream) === 0) {
              ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
            } else {
              const transferredView = new Uint8Array(transferredBuffer, byteOffset, byteLength);
              ReadableStreamFulfillReadRequest(stream, transferredView, false);
            }
          } else if (ReadableStreamHasBYOBReader(stream)) {
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
            ReadableByteStreamControllerProcessPullIntoDescriptorsUsingQueue(controller);
          } else {
            ReadableByteStreamControllerEnqueueChunkToQueue(controller, transferredBuffer, byteOffset, byteLength);
          }
          ReadableByteStreamControllerCallPullIfNeeded(controller);
        }
        function ReadableByteStreamControllerError(controller, e) {
          const stream = controller._controlledReadableByteStream;
          if (stream._state !== "readable") {
            return;
          }
          ReadableByteStreamControllerClearPendingPullIntos(controller);
          ResetQueue(controller);
          ReadableByteStreamControllerClearAlgorithms(controller);
          ReadableStreamError(stream, e);
        }
        function ReadableByteStreamControllerGetBYOBRequest(controller) {
          if (controller._byobRequest === null && controller._pendingPullIntos.length > 0) {
            const firstDescriptor = controller._pendingPullIntos.peek();
            const view = new Uint8Array(firstDescriptor.buffer, firstDescriptor.byteOffset + firstDescriptor.bytesFilled, firstDescriptor.byteLength - firstDescriptor.bytesFilled);
            const byobRequest = Object.create(ReadableStreamBYOBRequest.prototype);
            SetUpReadableStreamBYOBRequest(byobRequest, controller, view);
            controller._byobRequest = byobRequest;
          }
          return controller._byobRequest;
        }
        function ReadableByteStreamControllerGetDesiredSize(controller) {
          const state = controller._controlledReadableByteStream._state;
          if (state === "errored") {
            return null;
          }
          if (state === "closed") {
            return 0;
          }
          return controller._strategyHWM - controller._queueTotalSize;
        }
        function ReadableByteStreamControllerRespond(controller, bytesWritten) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          const state = controller._controlledReadableByteStream._state;
          if (state === "closed") {
            if (bytesWritten !== 0) {
              throw new TypeError("bytesWritten must be 0 when calling respond() on a closed stream");
            }
          } else {
            if (bytesWritten === 0) {
              throw new TypeError("bytesWritten must be greater than 0 when calling respond() on a readable stream");
            }
            if (firstDescriptor.bytesFilled + bytesWritten > firstDescriptor.byteLength) {
              throw new RangeError("bytesWritten out of range");
            }
          }
          firstDescriptor.buffer = TransferArrayBuffer(firstDescriptor.buffer);
          ReadableByteStreamControllerRespondInternal(controller, bytesWritten);
        }
        function ReadableByteStreamControllerRespondWithNewView(controller, view) {
          const firstDescriptor = controller._pendingPullIntos.peek();
          const state = controller._controlledReadableByteStream._state;
          if (state === "closed") {
            if (view.byteLength !== 0) {
              throw new TypeError("The view's length must be 0 when calling respondWithNewView() on a closed stream");
            }
          } else {
            if (view.byteLength === 0) {
              throw new TypeError("The view's length must be greater than 0 when calling respondWithNewView() on a readable stream");
            }
          }
          if (firstDescriptor.byteOffset + firstDescriptor.bytesFilled !== view.byteOffset) {
            throw new RangeError("The region specified by view does not match byobRequest");
          }
          if (firstDescriptor.bufferByteLength !== view.buffer.byteLength) {
            throw new RangeError("The buffer of view has different capacity than byobRequest");
          }
          if (firstDescriptor.bytesFilled + view.byteLength > firstDescriptor.byteLength) {
            throw new RangeError("The region specified by view is larger than byobRequest");
          }
          firstDescriptor.buffer = TransferArrayBuffer(view.buffer);
          ReadableByteStreamControllerRespondInternal(controller, view.byteLength);
        }
        function SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize) {
          controller._controlledReadableByteStream = stream;
          controller._pullAgain = false;
          controller._pulling = false;
          controller._byobRequest = null;
          controller._queue = controller._queueTotalSize = void 0;
          ResetQueue(controller);
          controller._closeRequested = false;
          controller._started = false;
          controller._strategyHWM = highWaterMark;
          controller._pullAlgorithm = pullAlgorithm;
          controller._cancelAlgorithm = cancelAlgorithm;
          controller._autoAllocateChunkSize = autoAllocateChunkSize;
          controller._pendingPullIntos = new SimpleQueue();
          stream._readableStreamController = controller;
          const startResult = startAlgorithm();
          uponPromise(promiseResolvedWith(startResult), () => {
            controller._started = true;
            ReadableByteStreamControllerCallPullIfNeeded(controller);
          }, (r) => {
            ReadableByteStreamControllerError(controller, r);
          });
        }
        function SetUpReadableByteStreamControllerFromUnderlyingSource(stream, underlyingByteSource, highWaterMark) {
          const controller = Object.create(ReadableByteStreamController.prototype);
          let startAlgorithm = () => void 0;
          let pullAlgorithm = () => promiseResolvedWith(void 0);
          let cancelAlgorithm = () => promiseResolvedWith(void 0);
          if (underlyingByteSource.start !== void 0) {
            startAlgorithm = () => underlyingByteSource.start(controller);
          }
          if (underlyingByteSource.pull !== void 0) {
            pullAlgorithm = () => underlyingByteSource.pull(controller);
          }
          if (underlyingByteSource.cancel !== void 0) {
            cancelAlgorithm = (reason) => underlyingByteSource.cancel(reason);
          }
          const autoAllocateChunkSize = underlyingByteSource.autoAllocateChunkSize;
          if (autoAllocateChunkSize === 0) {
            throw new TypeError("autoAllocateChunkSize must be greater than 0");
          }
          SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, autoAllocateChunkSize);
        }
        function SetUpReadableStreamBYOBRequest(request, controller, view) {
          request._associatedReadableByteStreamController = controller;
          request._view = view;
        }
        function byobRequestBrandCheckException(name) {
          return new TypeError(`ReadableStreamBYOBRequest.prototype.${name} can only be used on a ReadableStreamBYOBRequest`);
        }
        function byteStreamControllerBrandCheckException(name) {
          return new TypeError(`ReadableByteStreamController.prototype.${name} can only be used on a ReadableByteStreamController`);
        }
        function AcquireReadableStreamBYOBReader(stream) {
          return new ReadableStreamBYOBReader(stream);
        }
        function ReadableStreamAddReadIntoRequest(stream, readIntoRequest) {
          stream._reader._readIntoRequests.push(readIntoRequest);
        }
        function ReadableStreamFulfillReadIntoRequest(stream, chunk, done) {
          const reader = stream._reader;
          const readIntoRequest = reader._readIntoRequests.shift();
          if (done) {
            readIntoRequest._closeSteps(chunk);
          } else {
            readIntoRequest._chunkSteps(chunk);
          }
        }
        function ReadableStreamGetNumReadIntoRequests(stream) {
          return stream._reader._readIntoRequests.length;
        }
        function ReadableStreamHasBYOBReader(stream) {
          const reader = stream._reader;
          if (reader === void 0) {
            return false;
          }
          if (!IsReadableStreamBYOBReader(reader)) {
            return false;
          }
          return true;
        }
        class ReadableStreamBYOBReader {
          constructor(stream) {
            assertRequiredArgument(stream, 1, "ReadableStreamBYOBReader");
            assertReadableStream(stream, "First parameter");
            if (IsReadableStreamLocked(stream)) {
              throw new TypeError("This stream has already been locked for exclusive reading by another reader");
            }
            if (!IsReadableByteStreamController(stream._readableStreamController)) {
              throw new TypeError("Cannot construct a ReadableStreamBYOBReader for a stream not constructed with a byte source");
            }
            ReadableStreamReaderGenericInitialize(this, stream);
            this._readIntoRequests = new SimpleQueue();
          }
          get closed() {
            if (!IsReadableStreamBYOBReader(this)) {
              return promiseRejectedWith(byobReaderBrandCheckException("closed"));
            }
            return this._closedPromise;
          }
          cancel(reason = void 0) {
            if (!IsReadableStreamBYOBReader(this)) {
              return promiseRejectedWith(byobReaderBrandCheckException("cancel"));
            }
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("cancel"));
            }
            return ReadableStreamReaderGenericCancel(this, reason);
          }
          read(view) {
            if (!IsReadableStreamBYOBReader(this)) {
              return promiseRejectedWith(byobReaderBrandCheckException("read"));
            }
            if (!ArrayBuffer.isView(view)) {
              return promiseRejectedWith(new TypeError("view must be an array buffer view"));
            }
            if (view.byteLength === 0) {
              return promiseRejectedWith(new TypeError("view must have non-zero byteLength"));
            }
            if (view.buffer.byteLength === 0) {
              return promiseRejectedWith(new TypeError(`view's buffer must have non-zero byteLength`));
            }
            if (IsDetachedBuffer(view.buffer))
              ;
            if (this._ownerReadableStream === void 0) {
              return promiseRejectedWith(readerLockException("read from"));
            }
            let resolvePromise;
            let rejectPromise;
            const promise = newPromise((resolve2, reject) => {
              resolvePromise = resolve2;
              rejectPromise = reject;
            });
            const readIntoRequest = {
              _chunkSteps: (chunk) => resolvePromise({ value: chunk, done: false }),
              _closeSteps: (chunk) => resolvePromise({ value: chunk, done: true }),
              _errorSteps: (e) => rejectPromise(e)
            };
            ReadableStreamBYOBReaderRead(this, view, readIntoRequest);
            return promise;
          }
          releaseLock() {
            if (!IsReadableStreamBYOBReader(this)) {
              throw byobReaderBrandCheckException("releaseLock");
            }
            if (this._ownerReadableStream === void 0) {
              return;
            }
            if (this._readIntoRequests.length > 0) {
              throw new TypeError("Tried to release a reader lock when that reader has pending read() calls un-settled");
            }
            ReadableStreamReaderGenericRelease(this);
          }
        }
        Object.defineProperties(ReadableStreamBYOBReader.prototype, {
          cancel: { enumerable: true },
          read: { enumerable: true },
          releaseLock: { enumerable: true },
          closed: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamBYOBReader.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamBYOBReader",
            configurable: true
          });
        }
        function IsReadableStreamBYOBReader(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_readIntoRequests")) {
            return false;
          }
          return x instanceof ReadableStreamBYOBReader;
        }
        function ReadableStreamBYOBReaderRead(reader, view, readIntoRequest) {
          const stream = reader._ownerReadableStream;
          stream._disturbed = true;
          if (stream._state === "errored") {
            readIntoRequest._errorSteps(stream._storedError);
          } else {
            ReadableByteStreamControllerPullInto(stream._readableStreamController, view, readIntoRequest);
          }
        }
        function byobReaderBrandCheckException(name) {
          return new TypeError(`ReadableStreamBYOBReader.prototype.${name} can only be used on a ReadableStreamBYOBReader`);
        }
        function ExtractHighWaterMark(strategy, defaultHWM) {
          const { highWaterMark } = strategy;
          if (highWaterMark === void 0) {
            return defaultHWM;
          }
          if (NumberIsNaN(highWaterMark) || highWaterMark < 0) {
            throw new RangeError("Invalid highWaterMark");
          }
          return highWaterMark;
        }
        function ExtractSizeAlgorithm(strategy) {
          const { size } = strategy;
          if (!size) {
            return () => 1;
          }
          return size;
        }
        function convertQueuingStrategy(init2, context) {
          assertDictionary(init2, context);
          const highWaterMark = init2 === null || init2 === void 0 ? void 0 : init2.highWaterMark;
          const size = init2 === null || init2 === void 0 ? void 0 : init2.size;
          return {
            highWaterMark: highWaterMark === void 0 ? void 0 : convertUnrestrictedDouble(highWaterMark),
            size: size === void 0 ? void 0 : convertQueuingStrategySize(size, `${context} has member 'size' that`)
          };
        }
        function convertQueuingStrategySize(fn, context) {
          assertFunction(fn, context);
          return (chunk) => convertUnrestrictedDouble(fn(chunk));
        }
        function convertUnderlyingSink(original, context) {
          assertDictionary(original, context);
          const abort = original === null || original === void 0 ? void 0 : original.abort;
          const close = original === null || original === void 0 ? void 0 : original.close;
          const start = original === null || original === void 0 ? void 0 : original.start;
          const type = original === null || original === void 0 ? void 0 : original.type;
          const write = original === null || original === void 0 ? void 0 : original.write;
          return {
            abort: abort === void 0 ? void 0 : convertUnderlyingSinkAbortCallback(abort, original, `${context} has member 'abort' that`),
            close: close === void 0 ? void 0 : convertUnderlyingSinkCloseCallback(close, original, `${context} has member 'close' that`),
            start: start === void 0 ? void 0 : convertUnderlyingSinkStartCallback(start, original, `${context} has member 'start' that`),
            write: write === void 0 ? void 0 : convertUnderlyingSinkWriteCallback(write, original, `${context} has member 'write' that`),
            type
          };
        }
        function convertUnderlyingSinkAbortCallback(fn, original, context) {
          assertFunction(fn, context);
          return (reason) => promiseCall(fn, original, [reason]);
        }
        function convertUnderlyingSinkCloseCallback(fn, original, context) {
          assertFunction(fn, context);
          return () => promiseCall(fn, original, []);
        }
        function convertUnderlyingSinkStartCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => reflectCall(fn, original, [controller]);
        }
        function convertUnderlyingSinkWriteCallback(fn, original, context) {
          assertFunction(fn, context);
          return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
        }
        function assertWritableStream(x, context) {
          if (!IsWritableStream(x)) {
            throw new TypeError(`${context} is not a WritableStream.`);
          }
        }
        function isAbortSignal2(value) {
          if (typeof value !== "object" || value === null) {
            return false;
          }
          try {
            return typeof value.aborted === "boolean";
          } catch (_a) {
            return false;
          }
        }
        const supportsAbortController = typeof AbortController === "function";
        function createAbortController() {
          if (supportsAbortController) {
            return new AbortController();
          }
          return void 0;
        }
        class WritableStream {
          constructor(rawUnderlyingSink = {}, rawStrategy = {}) {
            if (rawUnderlyingSink === void 0) {
              rawUnderlyingSink = null;
            } else {
              assertObject(rawUnderlyingSink, "First parameter");
            }
            const strategy = convertQueuingStrategy(rawStrategy, "Second parameter");
            const underlyingSink = convertUnderlyingSink(rawUnderlyingSink, "First parameter");
            InitializeWritableStream(this);
            const type = underlyingSink.type;
            if (type !== void 0) {
              throw new RangeError("Invalid type is specified");
            }
            const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
            const highWaterMark = ExtractHighWaterMark(strategy, 1);
            SetUpWritableStreamDefaultControllerFromUnderlyingSink(this, underlyingSink, highWaterMark, sizeAlgorithm);
          }
          get locked() {
            if (!IsWritableStream(this)) {
              throw streamBrandCheckException$2("locked");
            }
            return IsWritableStreamLocked(this);
          }
          abort(reason = void 0) {
            if (!IsWritableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$2("abort"));
            }
            if (IsWritableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("Cannot abort a stream that already has a writer"));
            }
            return WritableStreamAbort(this, reason);
          }
          close() {
            if (!IsWritableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$2("close"));
            }
            if (IsWritableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("Cannot close a stream that already has a writer"));
            }
            if (WritableStreamCloseQueuedOrInFlight(this)) {
              return promiseRejectedWith(new TypeError("Cannot close an already-closing stream"));
            }
            return WritableStreamClose(this);
          }
          getWriter() {
            if (!IsWritableStream(this)) {
              throw streamBrandCheckException$2("getWriter");
            }
            return AcquireWritableStreamDefaultWriter(this);
          }
        }
        Object.defineProperties(WritableStream.prototype, {
          abort: { enumerable: true },
          close: { enumerable: true },
          getWriter: { enumerable: true },
          locked: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(WritableStream.prototype, SymbolPolyfill.toStringTag, {
            value: "WritableStream",
            configurable: true
          });
        }
        function AcquireWritableStreamDefaultWriter(stream) {
          return new WritableStreamDefaultWriter(stream);
        }
        function CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
          const stream = Object.create(WritableStream.prototype);
          InitializeWritableStream(stream);
          const controller = Object.create(WritableStreamDefaultController.prototype);
          SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
          return stream;
        }
        function InitializeWritableStream(stream) {
          stream._state = "writable";
          stream._storedError = void 0;
          stream._writer = void 0;
          stream._writableStreamController = void 0;
          stream._writeRequests = new SimpleQueue();
          stream._inFlightWriteRequest = void 0;
          stream._closeRequest = void 0;
          stream._inFlightCloseRequest = void 0;
          stream._pendingAbortRequest = void 0;
          stream._backpressure = false;
        }
        function IsWritableStream(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_writableStreamController")) {
            return false;
          }
          return x instanceof WritableStream;
        }
        function IsWritableStreamLocked(stream) {
          if (stream._writer === void 0) {
            return false;
          }
          return true;
        }
        function WritableStreamAbort(stream, reason) {
          var _a;
          if (stream._state === "closed" || stream._state === "errored") {
            return promiseResolvedWith(void 0);
          }
          stream._writableStreamController._abortReason = reason;
          (_a = stream._writableStreamController._abortController) === null || _a === void 0 ? void 0 : _a.abort();
          const state = stream._state;
          if (state === "closed" || state === "errored") {
            return promiseResolvedWith(void 0);
          }
          if (stream._pendingAbortRequest !== void 0) {
            return stream._pendingAbortRequest._promise;
          }
          let wasAlreadyErroring = false;
          if (state === "erroring") {
            wasAlreadyErroring = true;
            reason = void 0;
          }
          const promise = newPromise((resolve2, reject) => {
            stream._pendingAbortRequest = {
              _promise: void 0,
              _resolve: resolve2,
              _reject: reject,
              _reason: reason,
              _wasAlreadyErroring: wasAlreadyErroring
            };
          });
          stream._pendingAbortRequest._promise = promise;
          if (!wasAlreadyErroring) {
            WritableStreamStartErroring(stream, reason);
          }
          return promise;
        }
        function WritableStreamClose(stream) {
          const state = stream._state;
          if (state === "closed" || state === "errored") {
            return promiseRejectedWith(new TypeError(`The stream (in ${state} state) is not in the writable state and cannot be closed`));
          }
          const promise = newPromise((resolve2, reject) => {
            const closeRequest = {
              _resolve: resolve2,
              _reject: reject
            };
            stream._closeRequest = closeRequest;
          });
          const writer = stream._writer;
          if (writer !== void 0 && stream._backpressure && state === "writable") {
            defaultWriterReadyPromiseResolve(writer);
          }
          WritableStreamDefaultControllerClose(stream._writableStreamController);
          return promise;
        }
        function WritableStreamAddWriteRequest(stream) {
          const promise = newPromise((resolve2, reject) => {
            const writeRequest = {
              _resolve: resolve2,
              _reject: reject
            };
            stream._writeRequests.push(writeRequest);
          });
          return promise;
        }
        function WritableStreamDealWithRejection(stream, error2) {
          const state = stream._state;
          if (state === "writable") {
            WritableStreamStartErroring(stream, error2);
            return;
          }
          WritableStreamFinishErroring(stream);
        }
        function WritableStreamStartErroring(stream, reason) {
          const controller = stream._writableStreamController;
          stream._state = "erroring";
          stream._storedError = reason;
          const writer = stream._writer;
          if (writer !== void 0) {
            WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, reason);
          }
          if (!WritableStreamHasOperationMarkedInFlight(stream) && controller._started) {
            WritableStreamFinishErroring(stream);
          }
        }
        function WritableStreamFinishErroring(stream) {
          stream._state = "errored";
          stream._writableStreamController[ErrorSteps]();
          const storedError = stream._storedError;
          stream._writeRequests.forEach((writeRequest) => {
            writeRequest._reject(storedError);
          });
          stream._writeRequests = new SimpleQueue();
          if (stream._pendingAbortRequest === void 0) {
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
            return;
          }
          const abortRequest = stream._pendingAbortRequest;
          stream._pendingAbortRequest = void 0;
          if (abortRequest._wasAlreadyErroring) {
            abortRequest._reject(storedError);
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
            return;
          }
          const promise = stream._writableStreamController[AbortSteps](abortRequest._reason);
          uponPromise(promise, () => {
            abortRequest._resolve();
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          }, (reason) => {
            abortRequest._reject(reason);
            WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream);
          });
        }
        function WritableStreamFinishInFlightWrite(stream) {
          stream._inFlightWriteRequest._resolve(void 0);
          stream._inFlightWriteRequest = void 0;
        }
        function WritableStreamFinishInFlightWriteWithError(stream, error2) {
          stream._inFlightWriteRequest._reject(error2);
          stream._inFlightWriteRequest = void 0;
          WritableStreamDealWithRejection(stream, error2);
        }
        function WritableStreamFinishInFlightClose(stream) {
          stream._inFlightCloseRequest._resolve(void 0);
          stream._inFlightCloseRequest = void 0;
          const state = stream._state;
          if (state === "erroring") {
            stream._storedError = void 0;
            if (stream._pendingAbortRequest !== void 0) {
              stream._pendingAbortRequest._resolve();
              stream._pendingAbortRequest = void 0;
            }
          }
          stream._state = "closed";
          const writer = stream._writer;
          if (writer !== void 0) {
            defaultWriterClosedPromiseResolve(writer);
          }
        }
        function WritableStreamFinishInFlightCloseWithError(stream, error2) {
          stream._inFlightCloseRequest._reject(error2);
          stream._inFlightCloseRequest = void 0;
          if (stream._pendingAbortRequest !== void 0) {
            stream._pendingAbortRequest._reject(error2);
            stream._pendingAbortRequest = void 0;
          }
          WritableStreamDealWithRejection(stream, error2);
        }
        function WritableStreamCloseQueuedOrInFlight(stream) {
          if (stream._closeRequest === void 0 && stream._inFlightCloseRequest === void 0) {
            return false;
          }
          return true;
        }
        function WritableStreamHasOperationMarkedInFlight(stream) {
          if (stream._inFlightWriteRequest === void 0 && stream._inFlightCloseRequest === void 0) {
            return false;
          }
          return true;
        }
        function WritableStreamMarkCloseRequestInFlight(stream) {
          stream._inFlightCloseRequest = stream._closeRequest;
          stream._closeRequest = void 0;
        }
        function WritableStreamMarkFirstWriteRequestInFlight(stream) {
          stream._inFlightWriteRequest = stream._writeRequests.shift();
        }
        function WritableStreamRejectCloseAndClosedPromiseIfNeeded(stream) {
          if (stream._closeRequest !== void 0) {
            stream._closeRequest._reject(stream._storedError);
            stream._closeRequest = void 0;
          }
          const writer = stream._writer;
          if (writer !== void 0) {
            defaultWriterClosedPromiseReject(writer, stream._storedError);
          }
        }
        function WritableStreamUpdateBackpressure(stream, backpressure) {
          const writer = stream._writer;
          if (writer !== void 0 && backpressure !== stream._backpressure) {
            if (backpressure) {
              defaultWriterReadyPromiseReset(writer);
            } else {
              defaultWriterReadyPromiseResolve(writer);
            }
          }
          stream._backpressure = backpressure;
        }
        class WritableStreamDefaultWriter {
          constructor(stream) {
            assertRequiredArgument(stream, 1, "WritableStreamDefaultWriter");
            assertWritableStream(stream, "First parameter");
            if (IsWritableStreamLocked(stream)) {
              throw new TypeError("This stream has already been locked for exclusive writing by another writer");
            }
            this._ownerWritableStream = stream;
            stream._writer = this;
            const state = stream._state;
            if (state === "writable") {
              if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._backpressure) {
                defaultWriterReadyPromiseInitialize(this);
              } else {
                defaultWriterReadyPromiseInitializeAsResolved(this);
              }
              defaultWriterClosedPromiseInitialize(this);
            } else if (state === "erroring") {
              defaultWriterReadyPromiseInitializeAsRejected(this, stream._storedError);
              defaultWriterClosedPromiseInitialize(this);
            } else if (state === "closed") {
              defaultWriterReadyPromiseInitializeAsResolved(this);
              defaultWriterClosedPromiseInitializeAsResolved(this);
            } else {
              const storedError = stream._storedError;
              defaultWriterReadyPromiseInitializeAsRejected(this, storedError);
              defaultWriterClosedPromiseInitializeAsRejected(this, storedError);
            }
          }
          get closed() {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("closed"));
            }
            return this._closedPromise;
          }
          get desiredSize() {
            if (!IsWritableStreamDefaultWriter(this)) {
              throw defaultWriterBrandCheckException("desiredSize");
            }
            if (this._ownerWritableStream === void 0) {
              throw defaultWriterLockException("desiredSize");
            }
            return WritableStreamDefaultWriterGetDesiredSize(this);
          }
          get ready() {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("ready"));
            }
            return this._readyPromise;
          }
          abort(reason = void 0) {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("abort"));
            }
            if (this._ownerWritableStream === void 0) {
              return promiseRejectedWith(defaultWriterLockException("abort"));
            }
            return WritableStreamDefaultWriterAbort(this, reason);
          }
          close() {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("close"));
            }
            const stream = this._ownerWritableStream;
            if (stream === void 0) {
              return promiseRejectedWith(defaultWriterLockException("close"));
            }
            if (WritableStreamCloseQueuedOrInFlight(stream)) {
              return promiseRejectedWith(new TypeError("Cannot close an already-closing stream"));
            }
            return WritableStreamDefaultWriterClose(this);
          }
          releaseLock() {
            if (!IsWritableStreamDefaultWriter(this)) {
              throw defaultWriterBrandCheckException("releaseLock");
            }
            const stream = this._ownerWritableStream;
            if (stream === void 0) {
              return;
            }
            WritableStreamDefaultWriterRelease(this);
          }
          write(chunk = void 0) {
            if (!IsWritableStreamDefaultWriter(this)) {
              return promiseRejectedWith(defaultWriterBrandCheckException("write"));
            }
            if (this._ownerWritableStream === void 0) {
              return promiseRejectedWith(defaultWriterLockException("write to"));
            }
            return WritableStreamDefaultWriterWrite(this, chunk);
          }
        }
        Object.defineProperties(WritableStreamDefaultWriter.prototype, {
          abort: { enumerable: true },
          close: { enumerable: true },
          releaseLock: { enumerable: true },
          write: { enumerable: true },
          closed: { enumerable: true },
          desiredSize: { enumerable: true },
          ready: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(WritableStreamDefaultWriter.prototype, SymbolPolyfill.toStringTag, {
            value: "WritableStreamDefaultWriter",
            configurable: true
          });
        }
        function IsWritableStreamDefaultWriter(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_ownerWritableStream")) {
            return false;
          }
          return x instanceof WritableStreamDefaultWriter;
        }
        function WritableStreamDefaultWriterAbort(writer, reason) {
          const stream = writer._ownerWritableStream;
          return WritableStreamAbort(stream, reason);
        }
        function WritableStreamDefaultWriterClose(writer) {
          const stream = writer._ownerWritableStream;
          return WritableStreamClose(stream);
        }
        function WritableStreamDefaultWriterCloseWithErrorPropagation(writer) {
          const stream = writer._ownerWritableStream;
          const state = stream._state;
          if (WritableStreamCloseQueuedOrInFlight(stream) || state === "closed") {
            return promiseResolvedWith(void 0);
          }
          if (state === "errored") {
            return promiseRejectedWith(stream._storedError);
          }
          return WritableStreamDefaultWriterClose(writer);
        }
        function WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, error2) {
          if (writer._closedPromiseState === "pending") {
            defaultWriterClosedPromiseReject(writer, error2);
          } else {
            defaultWriterClosedPromiseResetToRejected(writer, error2);
          }
        }
        function WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, error2) {
          if (writer._readyPromiseState === "pending") {
            defaultWriterReadyPromiseReject(writer, error2);
          } else {
            defaultWriterReadyPromiseResetToRejected(writer, error2);
          }
        }
        function WritableStreamDefaultWriterGetDesiredSize(writer) {
          const stream = writer._ownerWritableStream;
          const state = stream._state;
          if (state === "errored" || state === "erroring") {
            return null;
          }
          if (state === "closed") {
            return 0;
          }
          return WritableStreamDefaultControllerGetDesiredSize(stream._writableStreamController);
        }
        function WritableStreamDefaultWriterRelease(writer) {
          const stream = writer._ownerWritableStream;
          const releasedError = new TypeError(`Writer was released and can no longer be used to monitor the stream's closedness`);
          WritableStreamDefaultWriterEnsureReadyPromiseRejected(writer, releasedError);
          WritableStreamDefaultWriterEnsureClosedPromiseRejected(writer, releasedError);
          stream._writer = void 0;
          writer._ownerWritableStream = void 0;
        }
        function WritableStreamDefaultWriterWrite(writer, chunk) {
          const stream = writer._ownerWritableStream;
          const controller = stream._writableStreamController;
          const chunkSize = WritableStreamDefaultControllerGetChunkSize(controller, chunk);
          if (stream !== writer._ownerWritableStream) {
            return promiseRejectedWith(defaultWriterLockException("write to"));
          }
          const state = stream._state;
          if (state === "errored") {
            return promiseRejectedWith(stream._storedError);
          }
          if (WritableStreamCloseQueuedOrInFlight(stream) || state === "closed") {
            return promiseRejectedWith(new TypeError("The stream is closing or closed and cannot be written to"));
          }
          if (state === "erroring") {
            return promiseRejectedWith(stream._storedError);
          }
          const promise = WritableStreamAddWriteRequest(stream);
          WritableStreamDefaultControllerWrite(controller, chunk, chunkSize);
          return promise;
        }
        const closeSentinel = {};
        class WritableStreamDefaultController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get abortReason() {
            if (!IsWritableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$2("abortReason");
            }
            return this._abortReason;
          }
          get signal() {
            if (!IsWritableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$2("signal");
            }
            if (this._abortController === void 0) {
              throw new TypeError("WritableStreamDefaultController.prototype.signal is not supported");
            }
            return this._abortController.signal;
          }
          error(e = void 0) {
            if (!IsWritableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$2("error");
            }
            const state = this._controlledWritableStream._state;
            if (state !== "writable") {
              return;
            }
            WritableStreamDefaultControllerError(this, e);
          }
          [AbortSteps](reason) {
            const result = this._abortAlgorithm(reason);
            WritableStreamDefaultControllerClearAlgorithms(this);
            return result;
          }
          [ErrorSteps]() {
            ResetQueue(this);
          }
        }
        Object.defineProperties(WritableStreamDefaultController.prototype, {
          error: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(WritableStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: "WritableStreamDefaultController",
            configurable: true
          });
        }
        function IsWritableStreamDefaultController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledWritableStream")) {
            return false;
          }
          return x instanceof WritableStreamDefaultController;
        }
        function SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm) {
          controller._controlledWritableStream = stream;
          stream._writableStreamController = controller;
          controller._queue = void 0;
          controller._queueTotalSize = void 0;
          ResetQueue(controller);
          controller._abortReason = void 0;
          controller._abortController = createAbortController();
          controller._started = false;
          controller._strategySizeAlgorithm = sizeAlgorithm;
          controller._strategyHWM = highWaterMark;
          controller._writeAlgorithm = writeAlgorithm;
          controller._closeAlgorithm = closeAlgorithm;
          controller._abortAlgorithm = abortAlgorithm;
          const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
          WritableStreamUpdateBackpressure(stream, backpressure);
          const startResult = startAlgorithm();
          const startPromise = promiseResolvedWith(startResult);
          uponPromise(startPromise, () => {
            controller._started = true;
            WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
          }, (r) => {
            controller._started = true;
            WritableStreamDealWithRejection(stream, r);
          });
        }
        function SetUpWritableStreamDefaultControllerFromUnderlyingSink(stream, underlyingSink, highWaterMark, sizeAlgorithm) {
          const controller = Object.create(WritableStreamDefaultController.prototype);
          let startAlgorithm = () => void 0;
          let writeAlgorithm = () => promiseResolvedWith(void 0);
          let closeAlgorithm = () => promiseResolvedWith(void 0);
          let abortAlgorithm = () => promiseResolvedWith(void 0);
          if (underlyingSink.start !== void 0) {
            startAlgorithm = () => underlyingSink.start(controller);
          }
          if (underlyingSink.write !== void 0) {
            writeAlgorithm = (chunk) => underlyingSink.write(chunk, controller);
          }
          if (underlyingSink.close !== void 0) {
            closeAlgorithm = () => underlyingSink.close();
          }
          if (underlyingSink.abort !== void 0) {
            abortAlgorithm = (reason) => underlyingSink.abort(reason);
          }
          SetUpWritableStreamDefaultController(stream, controller, startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, highWaterMark, sizeAlgorithm);
        }
        function WritableStreamDefaultControllerClearAlgorithms(controller) {
          controller._writeAlgorithm = void 0;
          controller._closeAlgorithm = void 0;
          controller._abortAlgorithm = void 0;
          controller._strategySizeAlgorithm = void 0;
        }
        function WritableStreamDefaultControllerClose(controller) {
          EnqueueValueWithSize(controller, closeSentinel, 0);
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
        }
        function WritableStreamDefaultControllerGetChunkSize(controller, chunk) {
          try {
            return controller._strategySizeAlgorithm(chunk);
          } catch (chunkSizeE) {
            WritableStreamDefaultControllerErrorIfNeeded(controller, chunkSizeE);
            return 1;
          }
        }
        function WritableStreamDefaultControllerGetDesiredSize(controller) {
          return controller._strategyHWM - controller._queueTotalSize;
        }
        function WritableStreamDefaultControllerWrite(controller, chunk, chunkSize) {
          try {
            EnqueueValueWithSize(controller, chunk, chunkSize);
          } catch (enqueueE) {
            WritableStreamDefaultControllerErrorIfNeeded(controller, enqueueE);
            return;
          }
          const stream = controller._controlledWritableStream;
          if (!WritableStreamCloseQueuedOrInFlight(stream) && stream._state === "writable") {
            const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
            WritableStreamUpdateBackpressure(stream, backpressure);
          }
          WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
        }
        function WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller) {
          const stream = controller._controlledWritableStream;
          if (!controller._started) {
            return;
          }
          if (stream._inFlightWriteRequest !== void 0) {
            return;
          }
          const state = stream._state;
          if (state === "erroring") {
            WritableStreamFinishErroring(stream);
            return;
          }
          if (controller._queue.length === 0) {
            return;
          }
          const value = PeekQueueValue(controller);
          if (value === closeSentinel) {
            WritableStreamDefaultControllerProcessClose(controller);
          } else {
            WritableStreamDefaultControllerProcessWrite(controller, value);
          }
        }
        function WritableStreamDefaultControllerErrorIfNeeded(controller, error2) {
          if (controller._controlledWritableStream._state === "writable") {
            WritableStreamDefaultControllerError(controller, error2);
          }
        }
        function WritableStreamDefaultControllerProcessClose(controller) {
          const stream = controller._controlledWritableStream;
          WritableStreamMarkCloseRequestInFlight(stream);
          DequeueValue(controller);
          const sinkClosePromise = controller._closeAlgorithm();
          WritableStreamDefaultControllerClearAlgorithms(controller);
          uponPromise(sinkClosePromise, () => {
            WritableStreamFinishInFlightClose(stream);
          }, (reason) => {
            WritableStreamFinishInFlightCloseWithError(stream, reason);
          });
        }
        function WritableStreamDefaultControllerProcessWrite(controller, chunk) {
          const stream = controller._controlledWritableStream;
          WritableStreamMarkFirstWriteRequestInFlight(stream);
          const sinkWritePromise = controller._writeAlgorithm(chunk);
          uponPromise(sinkWritePromise, () => {
            WritableStreamFinishInFlightWrite(stream);
            const state = stream._state;
            DequeueValue(controller);
            if (!WritableStreamCloseQueuedOrInFlight(stream) && state === "writable") {
              const backpressure = WritableStreamDefaultControllerGetBackpressure(controller);
              WritableStreamUpdateBackpressure(stream, backpressure);
            }
            WritableStreamDefaultControllerAdvanceQueueIfNeeded(controller);
          }, (reason) => {
            if (stream._state === "writable") {
              WritableStreamDefaultControllerClearAlgorithms(controller);
            }
            WritableStreamFinishInFlightWriteWithError(stream, reason);
          });
        }
        function WritableStreamDefaultControllerGetBackpressure(controller) {
          const desiredSize = WritableStreamDefaultControllerGetDesiredSize(controller);
          return desiredSize <= 0;
        }
        function WritableStreamDefaultControllerError(controller, error2) {
          const stream = controller._controlledWritableStream;
          WritableStreamDefaultControllerClearAlgorithms(controller);
          WritableStreamStartErroring(stream, error2);
        }
        function streamBrandCheckException$2(name) {
          return new TypeError(`WritableStream.prototype.${name} can only be used on a WritableStream`);
        }
        function defaultControllerBrandCheckException$2(name) {
          return new TypeError(`WritableStreamDefaultController.prototype.${name} can only be used on a WritableStreamDefaultController`);
        }
        function defaultWriterBrandCheckException(name) {
          return new TypeError(`WritableStreamDefaultWriter.prototype.${name} can only be used on a WritableStreamDefaultWriter`);
        }
        function defaultWriterLockException(name) {
          return new TypeError("Cannot " + name + " a stream using a released writer");
        }
        function defaultWriterClosedPromiseInitialize(writer) {
          writer._closedPromise = newPromise((resolve2, reject) => {
            writer._closedPromise_resolve = resolve2;
            writer._closedPromise_reject = reject;
            writer._closedPromiseState = "pending";
          });
        }
        function defaultWriterClosedPromiseInitializeAsRejected(writer, reason) {
          defaultWriterClosedPromiseInitialize(writer);
          defaultWriterClosedPromiseReject(writer, reason);
        }
        function defaultWriterClosedPromiseInitializeAsResolved(writer) {
          defaultWriterClosedPromiseInitialize(writer);
          defaultWriterClosedPromiseResolve(writer);
        }
        function defaultWriterClosedPromiseReject(writer, reason) {
          if (writer._closedPromise_reject === void 0) {
            return;
          }
          setPromiseIsHandledToTrue(writer._closedPromise);
          writer._closedPromise_reject(reason);
          writer._closedPromise_resolve = void 0;
          writer._closedPromise_reject = void 0;
          writer._closedPromiseState = "rejected";
        }
        function defaultWriterClosedPromiseResetToRejected(writer, reason) {
          defaultWriterClosedPromiseInitializeAsRejected(writer, reason);
        }
        function defaultWriterClosedPromiseResolve(writer) {
          if (writer._closedPromise_resolve === void 0) {
            return;
          }
          writer._closedPromise_resolve(void 0);
          writer._closedPromise_resolve = void 0;
          writer._closedPromise_reject = void 0;
          writer._closedPromiseState = "resolved";
        }
        function defaultWriterReadyPromiseInitialize(writer) {
          writer._readyPromise = newPromise((resolve2, reject) => {
            writer._readyPromise_resolve = resolve2;
            writer._readyPromise_reject = reject;
          });
          writer._readyPromiseState = "pending";
        }
        function defaultWriterReadyPromiseInitializeAsRejected(writer, reason) {
          defaultWriterReadyPromiseInitialize(writer);
          defaultWriterReadyPromiseReject(writer, reason);
        }
        function defaultWriterReadyPromiseInitializeAsResolved(writer) {
          defaultWriterReadyPromiseInitialize(writer);
          defaultWriterReadyPromiseResolve(writer);
        }
        function defaultWriterReadyPromiseReject(writer, reason) {
          if (writer._readyPromise_reject === void 0) {
            return;
          }
          setPromiseIsHandledToTrue(writer._readyPromise);
          writer._readyPromise_reject(reason);
          writer._readyPromise_resolve = void 0;
          writer._readyPromise_reject = void 0;
          writer._readyPromiseState = "rejected";
        }
        function defaultWriterReadyPromiseReset(writer) {
          defaultWriterReadyPromiseInitialize(writer);
        }
        function defaultWriterReadyPromiseResetToRejected(writer, reason) {
          defaultWriterReadyPromiseInitializeAsRejected(writer, reason);
        }
        function defaultWriterReadyPromiseResolve(writer) {
          if (writer._readyPromise_resolve === void 0) {
            return;
          }
          writer._readyPromise_resolve(void 0);
          writer._readyPromise_resolve = void 0;
          writer._readyPromise_reject = void 0;
          writer._readyPromiseState = "fulfilled";
        }
        const NativeDOMException = typeof DOMException !== "undefined" ? DOMException : void 0;
        function isDOMExceptionConstructor(ctor) {
          if (!(typeof ctor === "function" || typeof ctor === "object")) {
            return false;
          }
          try {
            new ctor();
            return true;
          } catch (_a) {
            return false;
          }
        }
        function createDOMExceptionPolyfill() {
          const ctor = function DOMException2(message, name) {
            this.message = message || "";
            this.name = name || "Error";
            if (Error.captureStackTrace) {
              Error.captureStackTrace(this, this.constructor);
            }
          };
          ctor.prototype = Object.create(Error.prototype);
          Object.defineProperty(ctor.prototype, "constructor", { value: ctor, writable: true, configurable: true });
          return ctor;
        }
        const DOMException$1 = isDOMExceptionConstructor(NativeDOMException) ? NativeDOMException : createDOMExceptionPolyfill();
        function ReadableStreamPipeTo(source, dest, preventClose, preventAbort, preventCancel, signal) {
          const reader = AcquireReadableStreamDefaultReader(source);
          const writer = AcquireWritableStreamDefaultWriter(dest);
          source._disturbed = true;
          let shuttingDown = false;
          let currentWrite = promiseResolvedWith(void 0);
          return newPromise((resolve2, reject) => {
            let abortAlgorithm;
            if (signal !== void 0) {
              abortAlgorithm = () => {
                const error2 = new DOMException$1("Aborted", "AbortError");
                const actions = [];
                if (!preventAbort) {
                  actions.push(() => {
                    if (dest._state === "writable") {
                      return WritableStreamAbort(dest, error2);
                    }
                    return promiseResolvedWith(void 0);
                  });
                }
                if (!preventCancel) {
                  actions.push(() => {
                    if (source._state === "readable") {
                      return ReadableStreamCancel(source, error2);
                    }
                    return promiseResolvedWith(void 0);
                  });
                }
                shutdownWithAction(() => Promise.all(actions.map((action) => action())), true, error2);
              };
              if (signal.aborted) {
                abortAlgorithm();
                return;
              }
              signal.addEventListener("abort", abortAlgorithm);
            }
            function pipeLoop() {
              return newPromise((resolveLoop, rejectLoop) => {
                function next2(done) {
                  if (done) {
                    resolveLoop();
                  } else {
                    PerformPromiseThen(pipeStep(), next2, rejectLoop);
                  }
                }
                next2(false);
              });
            }
            function pipeStep() {
              if (shuttingDown) {
                return promiseResolvedWith(true);
              }
              return PerformPromiseThen(writer._readyPromise, () => {
                return newPromise((resolveRead, rejectRead) => {
                  ReadableStreamDefaultReaderRead(reader, {
                    _chunkSteps: (chunk) => {
                      currentWrite = PerformPromiseThen(WritableStreamDefaultWriterWrite(writer, chunk), void 0, noop2);
                      resolveRead(false);
                    },
                    _closeSteps: () => resolveRead(true),
                    _errorSteps: rejectRead
                  });
                });
              });
            }
            isOrBecomesErrored(source, reader._closedPromise, (storedError) => {
              if (!preventAbort) {
                shutdownWithAction(() => WritableStreamAbort(dest, storedError), true, storedError);
              } else {
                shutdown(true, storedError);
              }
            });
            isOrBecomesErrored(dest, writer._closedPromise, (storedError) => {
              if (!preventCancel) {
                shutdownWithAction(() => ReadableStreamCancel(source, storedError), true, storedError);
              } else {
                shutdown(true, storedError);
              }
            });
            isOrBecomesClosed(source, reader._closedPromise, () => {
              if (!preventClose) {
                shutdownWithAction(() => WritableStreamDefaultWriterCloseWithErrorPropagation(writer));
              } else {
                shutdown();
              }
            });
            if (WritableStreamCloseQueuedOrInFlight(dest) || dest._state === "closed") {
              const destClosed = new TypeError("the destination writable stream closed before all data could be piped to it");
              if (!preventCancel) {
                shutdownWithAction(() => ReadableStreamCancel(source, destClosed), true, destClosed);
              } else {
                shutdown(true, destClosed);
              }
            }
            setPromiseIsHandledToTrue(pipeLoop());
            function waitForWritesToFinish() {
              const oldCurrentWrite = currentWrite;
              return PerformPromiseThen(currentWrite, () => oldCurrentWrite !== currentWrite ? waitForWritesToFinish() : void 0);
            }
            function isOrBecomesErrored(stream, promise, action) {
              if (stream._state === "errored") {
                action(stream._storedError);
              } else {
                uponRejection(promise, action);
              }
            }
            function isOrBecomesClosed(stream, promise, action) {
              if (stream._state === "closed") {
                action();
              } else {
                uponFulfillment(promise, action);
              }
            }
            function shutdownWithAction(action, originalIsError, originalError) {
              if (shuttingDown) {
                return;
              }
              shuttingDown = true;
              if (dest._state === "writable" && !WritableStreamCloseQueuedOrInFlight(dest)) {
                uponFulfillment(waitForWritesToFinish(), doTheRest);
              } else {
                doTheRest();
              }
              function doTheRest() {
                uponPromise(action(), () => finalize(originalIsError, originalError), (newError) => finalize(true, newError));
              }
            }
            function shutdown(isError, error2) {
              if (shuttingDown) {
                return;
              }
              shuttingDown = true;
              if (dest._state === "writable" && !WritableStreamCloseQueuedOrInFlight(dest)) {
                uponFulfillment(waitForWritesToFinish(), () => finalize(isError, error2));
              } else {
                finalize(isError, error2);
              }
            }
            function finalize(isError, error2) {
              WritableStreamDefaultWriterRelease(writer);
              ReadableStreamReaderGenericRelease(reader);
              if (signal !== void 0) {
                signal.removeEventListener("abort", abortAlgorithm);
              }
              if (isError) {
                reject(error2);
              } else {
                resolve2(void 0);
              }
            }
          });
        }
        class ReadableStreamDefaultController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get desiredSize() {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("desiredSize");
            }
            return ReadableStreamDefaultControllerGetDesiredSize(this);
          }
          close() {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("close");
            }
            if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
              throw new TypeError("The stream is not in a state that permits close");
            }
            ReadableStreamDefaultControllerClose(this);
          }
          enqueue(chunk = void 0) {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("enqueue");
            }
            if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(this)) {
              throw new TypeError("The stream is not in a state that permits enqueue");
            }
            return ReadableStreamDefaultControllerEnqueue(this, chunk);
          }
          error(e = void 0) {
            if (!IsReadableStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException$1("error");
            }
            ReadableStreamDefaultControllerError(this, e);
          }
          [CancelSteps](reason) {
            ResetQueue(this);
            const result = this._cancelAlgorithm(reason);
            ReadableStreamDefaultControllerClearAlgorithms(this);
            return result;
          }
          [PullSteps](readRequest) {
            const stream = this._controlledReadableStream;
            if (this._queue.length > 0) {
              const chunk = DequeueValue(this);
              if (this._closeRequested && this._queue.length === 0) {
                ReadableStreamDefaultControllerClearAlgorithms(this);
                ReadableStreamClose(stream);
              } else {
                ReadableStreamDefaultControllerCallPullIfNeeded(this);
              }
              readRequest._chunkSteps(chunk);
            } else {
              ReadableStreamAddReadRequest(stream, readRequest);
              ReadableStreamDefaultControllerCallPullIfNeeded(this);
            }
          }
        }
        Object.defineProperties(ReadableStreamDefaultController.prototype, {
          close: { enumerable: true },
          enqueue: { enumerable: true },
          error: { enumerable: true },
          desiredSize: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStreamDefaultController",
            configurable: true
          });
        }
        function IsReadableStreamDefaultController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledReadableStream")) {
            return false;
          }
          return x instanceof ReadableStreamDefaultController;
        }
        function ReadableStreamDefaultControllerCallPullIfNeeded(controller) {
          const shouldPull = ReadableStreamDefaultControllerShouldCallPull(controller);
          if (!shouldPull) {
            return;
          }
          if (controller._pulling) {
            controller._pullAgain = true;
            return;
          }
          controller._pulling = true;
          const pullPromise = controller._pullAlgorithm();
          uponPromise(pullPromise, () => {
            controller._pulling = false;
            if (controller._pullAgain) {
              controller._pullAgain = false;
              ReadableStreamDefaultControllerCallPullIfNeeded(controller);
            }
          }, (e) => {
            ReadableStreamDefaultControllerError(controller, e);
          });
        }
        function ReadableStreamDefaultControllerShouldCallPull(controller) {
          const stream = controller._controlledReadableStream;
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return false;
          }
          if (!controller._started) {
            return false;
          }
          if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            return true;
          }
          const desiredSize = ReadableStreamDefaultControllerGetDesiredSize(controller);
          if (desiredSize > 0) {
            return true;
          }
          return false;
        }
        function ReadableStreamDefaultControllerClearAlgorithms(controller) {
          controller._pullAlgorithm = void 0;
          controller._cancelAlgorithm = void 0;
          controller._strategySizeAlgorithm = void 0;
        }
        function ReadableStreamDefaultControllerClose(controller) {
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return;
          }
          const stream = controller._controlledReadableStream;
          controller._closeRequested = true;
          if (controller._queue.length === 0) {
            ReadableStreamDefaultControllerClearAlgorithms(controller);
            ReadableStreamClose(stream);
          }
        }
        function ReadableStreamDefaultControllerEnqueue(controller, chunk) {
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(controller)) {
            return;
          }
          const stream = controller._controlledReadableStream;
          if (IsReadableStreamLocked(stream) && ReadableStreamGetNumReadRequests(stream) > 0) {
            ReadableStreamFulfillReadRequest(stream, chunk, false);
          } else {
            let chunkSize;
            try {
              chunkSize = controller._strategySizeAlgorithm(chunk);
            } catch (chunkSizeE) {
              ReadableStreamDefaultControllerError(controller, chunkSizeE);
              throw chunkSizeE;
            }
            try {
              EnqueueValueWithSize(controller, chunk, chunkSize);
            } catch (enqueueE) {
              ReadableStreamDefaultControllerError(controller, enqueueE);
              throw enqueueE;
            }
          }
          ReadableStreamDefaultControllerCallPullIfNeeded(controller);
        }
        function ReadableStreamDefaultControllerError(controller, e) {
          const stream = controller._controlledReadableStream;
          if (stream._state !== "readable") {
            return;
          }
          ResetQueue(controller);
          ReadableStreamDefaultControllerClearAlgorithms(controller);
          ReadableStreamError(stream, e);
        }
        function ReadableStreamDefaultControllerGetDesiredSize(controller) {
          const state = controller._controlledReadableStream._state;
          if (state === "errored") {
            return null;
          }
          if (state === "closed") {
            return 0;
          }
          return controller._strategyHWM - controller._queueTotalSize;
        }
        function ReadableStreamDefaultControllerHasBackpressure(controller) {
          if (ReadableStreamDefaultControllerShouldCallPull(controller)) {
            return false;
          }
          return true;
        }
        function ReadableStreamDefaultControllerCanCloseOrEnqueue(controller) {
          const state = controller._controlledReadableStream._state;
          if (!controller._closeRequested && state === "readable") {
            return true;
          }
          return false;
        }
        function SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm) {
          controller._controlledReadableStream = stream;
          controller._queue = void 0;
          controller._queueTotalSize = void 0;
          ResetQueue(controller);
          controller._started = false;
          controller._closeRequested = false;
          controller._pullAgain = false;
          controller._pulling = false;
          controller._strategySizeAlgorithm = sizeAlgorithm;
          controller._strategyHWM = highWaterMark;
          controller._pullAlgorithm = pullAlgorithm;
          controller._cancelAlgorithm = cancelAlgorithm;
          stream._readableStreamController = controller;
          const startResult = startAlgorithm();
          uponPromise(promiseResolvedWith(startResult), () => {
            controller._started = true;
            ReadableStreamDefaultControllerCallPullIfNeeded(controller);
          }, (r) => {
            ReadableStreamDefaultControllerError(controller, r);
          });
        }
        function SetUpReadableStreamDefaultControllerFromUnderlyingSource(stream, underlyingSource, highWaterMark, sizeAlgorithm) {
          const controller = Object.create(ReadableStreamDefaultController.prototype);
          let startAlgorithm = () => void 0;
          let pullAlgorithm = () => promiseResolvedWith(void 0);
          let cancelAlgorithm = () => promiseResolvedWith(void 0);
          if (underlyingSource.start !== void 0) {
            startAlgorithm = () => underlyingSource.start(controller);
          }
          if (underlyingSource.pull !== void 0) {
            pullAlgorithm = () => underlyingSource.pull(controller);
          }
          if (underlyingSource.cancel !== void 0) {
            cancelAlgorithm = (reason) => underlyingSource.cancel(reason);
          }
          SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
        }
        function defaultControllerBrandCheckException$1(name) {
          return new TypeError(`ReadableStreamDefaultController.prototype.${name} can only be used on a ReadableStreamDefaultController`);
        }
        function ReadableStreamTee(stream, cloneForBranch2) {
          if (IsReadableByteStreamController(stream._readableStreamController)) {
            return ReadableByteStreamTee(stream);
          }
          return ReadableStreamDefaultTee(stream);
        }
        function ReadableStreamDefaultTee(stream, cloneForBranch2) {
          const reader = AcquireReadableStreamDefaultReader(stream);
          let reading = false;
          let canceled1 = false;
          let canceled2 = false;
          let reason1;
          let reason2;
          let branch1;
          let branch2;
          let resolveCancelPromise;
          const cancelPromise = newPromise((resolve2) => {
            resolveCancelPromise = resolve2;
          });
          function pullAlgorithm() {
            if (reading) {
              return promiseResolvedWith(void 0);
            }
            reading = true;
            const readRequest = {
              _chunkSteps: (chunk) => {
                queueMicrotask(() => {
                  reading = false;
                  const chunk1 = chunk;
                  const chunk2 = chunk;
                  if (!canceled1) {
                    ReadableStreamDefaultControllerEnqueue(branch1._readableStreamController, chunk1);
                  }
                  if (!canceled2) {
                    ReadableStreamDefaultControllerEnqueue(branch2._readableStreamController, chunk2);
                  }
                });
              },
              _closeSteps: () => {
                reading = false;
                if (!canceled1) {
                  ReadableStreamDefaultControllerClose(branch1._readableStreamController);
                }
                if (!canceled2) {
                  ReadableStreamDefaultControllerClose(branch2._readableStreamController);
                }
                if (!canceled1 || !canceled2) {
                  resolveCancelPromise(void 0);
                }
              },
              _errorSteps: () => {
                reading = false;
              }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
            return promiseResolvedWith(void 0);
          }
          function cancel1Algorithm(reason) {
            canceled1 = true;
            reason1 = reason;
            if (canceled2) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function cancel2Algorithm(reason) {
            canceled2 = true;
            reason2 = reason;
            if (canceled1) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function startAlgorithm() {
          }
          branch1 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel1Algorithm);
          branch2 = CreateReadableStream(startAlgorithm, pullAlgorithm, cancel2Algorithm);
          uponRejection(reader._closedPromise, (r) => {
            ReadableStreamDefaultControllerError(branch1._readableStreamController, r);
            ReadableStreamDefaultControllerError(branch2._readableStreamController, r);
            if (!canceled1 || !canceled2) {
              resolveCancelPromise(void 0);
            }
          });
          return [branch1, branch2];
        }
        function ReadableByteStreamTee(stream) {
          let reader = AcquireReadableStreamDefaultReader(stream);
          let reading = false;
          let canceled1 = false;
          let canceled2 = false;
          let reason1;
          let reason2;
          let branch1;
          let branch2;
          let resolveCancelPromise;
          const cancelPromise = newPromise((resolve2) => {
            resolveCancelPromise = resolve2;
          });
          function forwardReaderError(thisReader) {
            uponRejection(thisReader._closedPromise, (r) => {
              if (thisReader !== reader) {
                return;
              }
              ReadableByteStreamControllerError(branch1._readableStreamController, r);
              ReadableByteStreamControllerError(branch2._readableStreamController, r);
              if (!canceled1 || !canceled2) {
                resolveCancelPromise(void 0);
              }
            });
          }
          function pullWithDefaultReader() {
            if (IsReadableStreamBYOBReader(reader)) {
              ReadableStreamReaderGenericRelease(reader);
              reader = AcquireReadableStreamDefaultReader(stream);
              forwardReaderError(reader);
            }
            const readRequest = {
              _chunkSteps: (chunk) => {
                queueMicrotask(() => {
                  reading = false;
                  const chunk1 = chunk;
                  let chunk2 = chunk;
                  if (!canceled1 && !canceled2) {
                    try {
                      chunk2 = CloneAsUint8Array(chunk);
                    } catch (cloneE) {
                      ReadableByteStreamControllerError(branch1._readableStreamController, cloneE);
                      ReadableByteStreamControllerError(branch2._readableStreamController, cloneE);
                      resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                      return;
                    }
                  }
                  if (!canceled1) {
                    ReadableByteStreamControllerEnqueue(branch1._readableStreamController, chunk1);
                  }
                  if (!canceled2) {
                    ReadableByteStreamControllerEnqueue(branch2._readableStreamController, chunk2);
                  }
                });
              },
              _closeSteps: () => {
                reading = false;
                if (!canceled1) {
                  ReadableByteStreamControllerClose(branch1._readableStreamController);
                }
                if (!canceled2) {
                  ReadableByteStreamControllerClose(branch2._readableStreamController);
                }
                if (branch1._readableStreamController._pendingPullIntos.length > 0) {
                  ReadableByteStreamControllerRespond(branch1._readableStreamController, 0);
                }
                if (branch2._readableStreamController._pendingPullIntos.length > 0) {
                  ReadableByteStreamControllerRespond(branch2._readableStreamController, 0);
                }
                if (!canceled1 || !canceled2) {
                  resolveCancelPromise(void 0);
                }
              },
              _errorSteps: () => {
                reading = false;
              }
            };
            ReadableStreamDefaultReaderRead(reader, readRequest);
          }
          function pullWithBYOBReader(view, forBranch2) {
            if (IsReadableStreamDefaultReader(reader)) {
              ReadableStreamReaderGenericRelease(reader);
              reader = AcquireReadableStreamBYOBReader(stream);
              forwardReaderError(reader);
            }
            const byobBranch = forBranch2 ? branch2 : branch1;
            const otherBranch = forBranch2 ? branch1 : branch2;
            const readIntoRequest = {
              _chunkSteps: (chunk) => {
                queueMicrotask(() => {
                  reading = false;
                  const byobCanceled = forBranch2 ? canceled2 : canceled1;
                  const otherCanceled = forBranch2 ? canceled1 : canceled2;
                  if (!otherCanceled) {
                    let clonedChunk;
                    try {
                      clonedChunk = CloneAsUint8Array(chunk);
                    } catch (cloneE) {
                      ReadableByteStreamControllerError(byobBranch._readableStreamController, cloneE);
                      ReadableByteStreamControllerError(otherBranch._readableStreamController, cloneE);
                      resolveCancelPromise(ReadableStreamCancel(stream, cloneE));
                      return;
                    }
                    if (!byobCanceled) {
                      ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                    }
                    ReadableByteStreamControllerEnqueue(otherBranch._readableStreamController, clonedChunk);
                  } else if (!byobCanceled) {
                    ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                  }
                });
              },
              _closeSteps: (chunk) => {
                reading = false;
                const byobCanceled = forBranch2 ? canceled2 : canceled1;
                const otherCanceled = forBranch2 ? canceled1 : canceled2;
                if (!byobCanceled) {
                  ReadableByteStreamControllerClose(byobBranch._readableStreamController);
                }
                if (!otherCanceled) {
                  ReadableByteStreamControllerClose(otherBranch._readableStreamController);
                }
                if (chunk !== void 0) {
                  if (!byobCanceled) {
                    ReadableByteStreamControllerRespondWithNewView(byobBranch._readableStreamController, chunk);
                  }
                  if (!otherCanceled && otherBranch._readableStreamController._pendingPullIntos.length > 0) {
                    ReadableByteStreamControllerRespond(otherBranch._readableStreamController, 0);
                  }
                }
                if (!byobCanceled || !otherCanceled) {
                  resolveCancelPromise(void 0);
                }
              },
              _errorSteps: () => {
                reading = false;
              }
            };
            ReadableStreamBYOBReaderRead(reader, view, readIntoRequest);
          }
          function pull1Algorithm() {
            if (reading) {
              return promiseResolvedWith(void 0);
            }
            reading = true;
            const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch1._readableStreamController);
            if (byobRequest === null) {
              pullWithDefaultReader();
            } else {
              pullWithBYOBReader(byobRequest._view, false);
            }
            return promiseResolvedWith(void 0);
          }
          function pull2Algorithm() {
            if (reading) {
              return promiseResolvedWith(void 0);
            }
            reading = true;
            const byobRequest = ReadableByteStreamControllerGetBYOBRequest(branch2._readableStreamController);
            if (byobRequest === null) {
              pullWithDefaultReader();
            } else {
              pullWithBYOBReader(byobRequest._view, true);
            }
            return promiseResolvedWith(void 0);
          }
          function cancel1Algorithm(reason) {
            canceled1 = true;
            reason1 = reason;
            if (canceled2) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function cancel2Algorithm(reason) {
            canceled2 = true;
            reason2 = reason;
            if (canceled1) {
              const compositeReason = CreateArrayFromList([reason1, reason2]);
              const cancelResult = ReadableStreamCancel(stream, compositeReason);
              resolveCancelPromise(cancelResult);
            }
            return cancelPromise;
          }
          function startAlgorithm() {
            return;
          }
          branch1 = CreateReadableByteStream(startAlgorithm, pull1Algorithm, cancel1Algorithm);
          branch2 = CreateReadableByteStream(startAlgorithm, pull2Algorithm, cancel2Algorithm);
          forwardReaderError(reader);
          return [branch1, branch2];
        }
        function convertUnderlyingDefaultOrByteSource(source, context) {
          assertDictionary(source, context);
          const original = source;
          const autoAllocateChunkSize = original === null || original === void 0 ? void 0 : original.autoAllocateChunkSize;
          const cancel = original === null || original === void 0 ? void 0 : original.cancel;
          const pull = original === null || original === void 0 ? void 0 : original.pull;
          const start = original === null || original === void 0 ? void 0 : original.start;
          const type = original === null || original === void 0 ? void 0 : original.type;
          return {
            autoAllocateChunkSize: autoAllocateChunkSize === void 0 ? void 0 : convertUnsignedLongLongWithEnforceRange(autoAllocateChunkSize, `${context} has member 'autoAllocateChunkSize' that`),
            cancel: cancel === void 0 ? void 0 : convertUnderlyingSourceCancelCallback(cancel, original, `${context} has member 'cancel' that`),
            pull: pull === void 0 ? void 0 : convertUnderlyingSourcePullCallback(pull, original, `${context} has member 'pull' that`),
            start: start === void 0 ? void 0 : convertUnderlyingSourceStartCallback(start, original, `${context} has member 'start' that`),
            type: type === void 0 ? void 0 : convertReadableStreamType(type, `${context} has member 'type' that`)
          };
        }
        function convertUnderlyingSourceCancelCallback(fn, original, context) {
          assertFunction(fn, context);
          return (reason) => promiseCall(fn, original, [reason]);
        }
        function convertUnderlyingSourcePullCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => promiseCall(fn, original, [controller]);
        }
        function convertUnderlyingSourceStartCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => reflectCall(fn, original, [controller]);
        }
        function convertReadableStreamType(type, context) {
          type = `${type}`;
          if (type !== "bytes") {
            throw new TypeError(`${context} '${type}' is not a valid enumeration value for ReadableStreamType`);
          }
          return type;
        }
        function convertReaderOptions(options2, context) {
          assertDictionary(options2, context);
          const mode = options2 === null || options2 === void 0 ? void 0 : options2.mode;
          return {
            mode: mode === void 0 ? void 0 : convertReadableStreamReaderMode(mode, `${context} has member 'mode' that`)
          };
        }
        function convertReadableStreamReaderMode(mode, context) {
          mode = `${mode}`;
          if (mode !== "byob") {
            throw new TypeError(`${context} '${mode}' is not a valid enumeration value for ReadableStreamReaderMode`);
          }
          return mode;
        }
        function convertIteratorOptions(options2, context) {
          assertDictionary(options2, context);
          const preventCancel = options2 === null || options2 === void 0 ? void 0 : options2.preventCancel;
          return { preventCancel: Boolean(preventCancel) };
        }
        function convertPipeOptions(options2, context) {
          assertDictionary(options2, context);
          const preventAbort = options2 === null || options2 === void 0 ? void 0 : options2.preventAbort;
          const preventCancel = options2 === null || options2 === void 0 ? void 0 : options2.preventCancel;
          const preventClose = options2 === null || options2 === void 0 ? void 0 : options2.preventClose;
          const signal = options2 === null || options2 === void 0 ? void 0 : options2.signal;
          if (signal !== void 0) {
            assertAbortSignal(signal, `${context} has member 'signal' that`);
          }
          return {
            preventAbort: Boolean(preventAbort),
            preventCancel: Boolean(preventCancel),
            preventClose: Boolean(preventClose),
            signal
          };
        }
        function assertAbortSignal(signal, context) {
          if (!isAbortSignal2(signal)) {
            throw new TypeError(`${context} is not an AbortSignal.`);
          }
        }
        function convertReadableWritablePair(pair, context) {
          assertDictionary(pair, context);
          const readable2 = pair === null || pair === void 0 ? void 0 : pair.readable;
          assertRequiredField(readable2, "readable", "ReadableWritablePair");
          assertReadableStream(readable2, `${context} has member 'readable' that`);
          const writable3 = pair === null || pair === void 0 ? void 0 : pair.writable;
          assertRequiredField(writable3, "writable", "ReadableWritablePair");
          assertWritableStream(writable3, `${context} has member 'writable' that`);
          return { readable: readable2, writable: writable3 };
        }
        class ReadableStream2 {
          constructor(rawUnderlyingSource = {}, rawStrategy = {}) {
            if (rawUnderlyingSource === void 0) {
              rawUnderlyingSource = null;
            } else {
              assertObject(rawUnderlyingSource, "First parameter");
            }
            const strategy = convertQueuingStrategy(rawStrategy, "Second parameter");
            const underlyingSource = convertUnderlyingDefaultOrByteSource(rawUnderlyingSource, "First parameter");
            InitializeReadableStream(this);
            if (underlyingSource.type === "bytes") {
              if (strategy.size !== void 0) {
                throw new RangeError("The strategy for a byte stream cannot have a size function");
              }
              const highWaterMark = ExtractHighWaterMark(strategy, 0);
              SetUpReadableByteStreamControllerFromUnderlyingSource(this, underlyingSource, highWaterMark);
            } else {
              const sizeAlgorithm = ExtractSizeAlgorithm(strategy);
              const highWaterMark = ExtractHighWaterMark(strategy, 1);
              SetUpReadableStreamDefaultControllerFromUnderlyingSource(this, underlyingSource, highWaterMark, sizeAlgorithm);
            }
          }
          get locked() {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("locked");
            }
            return IsReadableStreamLocked(this);
          }
          cancel(reason = void 0) {
            if (!IsReadableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$1("cancel"));
            }
            if (IsReadableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("Cannot cancel a stream that already has a reader"));
            }
            return ReadableStreamCancel(this, reason);
          }
          getReader(rawOptions = void 0) {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("getReader");
            }
            const options2 = convertReaderOptions(rawOptions, "First parameter");
            if (options2.mode === void 0) {
              return AcquireReadableStreamDefaultReader(this);
            }
            return AcquireReadableStreamBYOBReader(this);
          }
          pipeThrough(rawTransform, rawOptions = {}) {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("pipeThrough");
            }
            assertRequiredArgument(rawTransform, 1, "pipeThrough");
            const transform2 = convertReadableWritablePair(rawTransform, "First parameter");
            const options2 = convertPipeOptions(rawOptions, "Second parameter");
            if (IsReadableStreamLocked(this)) {
              throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked ReadableStream");
            }
            if (IsWritableStreamLocked(transform2.writable)) {
              throw new TypeError("ReadableStream.prototype.pipeThrough cannot be used on a locked WritableStream");
            }
            const promise = ReadableStreamPipeTo(this, transform2.writable, options2.preventClose, options2.preventAbort, options2.preventCancel, options2.signal);
            setPromiseIsHandledToTrue(promise);
            return transform2.readable;
          }
          pipeTo(destination, rawOptions = {}) {
            if (!IsReadableStream(this)) {
              return promiseRejectedWith(streamBrandCheckException$1("pipeTo"));
            }
            if (destination === void 0) {
              return promiseRejectedWith(`Parameter 1 is required in 'pipeTo'.`);
            }
            if (!IsWritableStream(destination)) {
              return promiseRejectedWith(new TypeError(`ReadableStream.prototype.pipeTo's first argument must be a WritableStream`));
            }
            let options2;
            try {
              options2 = convertPipeOptions(rawOptions, "Second parameter");
            } catch (e) {
              return promiseRejectedWith(e);
            }
            if (IsReadableStreamLocked(this)) {
              return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked ReadableStream"));
            }
            if (IsWritableStreamLocked(destination)) {
              return promiseRejectedWith(new TypeError("ReadableStream.prototype.pipeTo cannot be used on a locked WritableStream"));
            }
            return ReadableStreamPipeTo(this, destination, options2.preventClose, options2.preventAbort, options2.preventCancel, options2.signal);
          }
          tee() {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("tee");
            }
            const branches = ReadableStreamTee(this);
            return CreateArrayFromList(branches);
          }
          values(rawOptions = void 0) {
            if (!IsReadableStream(this)) {
              throw streamBrandCheckException$1("values");
            }
            const options2 = convertIteratorOptions(rawOptions, "First parameter");
            return AcquireReadableStreamAsyncIterator(this, options2.preventCancel);
          }
        }
        Object.defineProperties(ReadableStream2.prototype, {
          cancel: { enumerable: true },
          getReader: { enumerable: true },
          pipeThrough: { enumerable: true },
          pipeTo: { enumerable: true },
          tee: { enumerable: true },
          values: { enumerable: true },
          locked: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ReadableStream2.prototype, SymbolPolyfill.toStringTag, {
            value: "ReadableStream",
            configurable: true
          });
        }
        if (typeof SymbolPolyfill.asyncIterator === "symbol") {
          Object.defineProperty(ReadableStream2.prototype, SymbolPolyfill.asyncIterator, {
            value: ReadableStream2.prototype.values,
            writable: true,
            configurable: true
          });
        }
        function CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark = 1, sizeAlgorithm = () => 1) {
          const stream = Object.create(ReadableStream2.prototype);
          InitializeReadableStream(stream);
          const controller = Object.create(ReadableStreamDefaultController.prototype);
          SetUpReadableStreamDefaultController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, highWaterMark, sizeAlgorithm);
          return stream;
        }
        function CreateReadableByteStream(startAlgorithm, pullAlgorithm, cancelAlgorithm) {
          const stream = Object.create(ReadableStream2.prototype);
          InitializeReadableStream(stream);
          const controller = Object.create(ReadableByteStreamController.prototype);
          SetUpReadableByteStreamController(stream, controller, startAlgorithm, pullAlgorithm, cancelAlgorithm, 0, void 0);
          return stream;
        }
        function InitializeReadableStream(stream) {
          stream._state = "readable";
          stream._reader = void 0;
          stream._storedError = void 0;
          stream._disturbed = false;
        }
        function IsReadableStream(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_readableStreamController")) {
            return false;
          }
          return x instanceof ReadableStream2;
        }
        function IsReadableStreamLocked(stream) {
          if (stream._reader === void 0) {
            return false;
          }
          return true;
        }
        function ReadableStreamCancel(stream, reason) {
          stream._disturbed = true;
          if (stream._state === "closed") {
            return promiseResolvedWith(void 0);
          }
          if (stream._state === "errored") {
            return promiseRejectedWith(stream._storedError);
          }
          ReadableStreamClose(stream);
          const reader = stream._reader;
          if (reader !== void 0 && IsReadableStreamBYOBReader(reader)) {
            reader._readIntoRequests.forEach((readIntoRequest) => {
              readIntoRequest._closeSteps(void 0);
            });
            reader._readIntoRequests = new SimpleQueue();
          }
          const sourceCancelPromise = stream._readableStreamController[CancelSteps](reason);
          return transformPromiseWith(sourceCancelPromise, noop2);
        }
        function ReadableStreamClose(stream) {
          stream._state = "closed";
          const reader = stream._reader;
          if (reader === void 0) {
            return;
          }
          defaultReaderClosedPromiseResolve(reader);
          if (IsReadableStreamDefaultReader(reader)) {
            reader._readRequests.forEach((readRequest) => {
              readRequest._closeSteps();
            });
            reader._readRequests = new SimpleQueue();
          }
        }
        function ReadableStreamError(stream, e) {
          stream._state = "errored";
          stream._storedError = e;
          const reader = stream._reader;
          if (reader === void 0) {
            return;
          }
          defaultReaderClosedPromiseReject(reader, e);
          if (IsReadableStreamDefaultReader(reader)) {
            reader._readRequests.forEach((readRequest) => {
              readRequest._errorSteps(e);
            });
            reader._readRequests = new SimpleQueue();
          } else {
            reader._readIntoRequests.forEach((readIntoRequest) => {
              readIntoRequest._errorSteps(e);
            });
            reader._readIntoRequests = new SimpleQueue();
          }
        }
        function streamBrandCheckException$1(name) {
          return new TypeError(`ReadableStream.prototype.${name} can only be used on a ReadableStream`);
        }
        function convertQueuingStrategyInit(init2, context) {
          assertDictionary(init2, context);
          const highWaterMark = init2 === null || init2 === void 0 ? void 0 : init2.highWaterMark;
          assertRequiredField(highWaterMark, "highWaterMark", "QueuingStrategyInit");
          return {
            highWaterMark: convertUnrestrictedDouble(highWaterMark)
          };
        }
        const byteLengthSizeFunction = (chunk) => {
          return chunk.byteLength;
        };
        Object.defineProperty(byteLengthSizeFunction, "name", {
          value: "size",
          configurable: true
        });
        class ByteLengthQueuingStrategy {
          constructor(options2) {
            assertRequiredArgument(options2, 1, "ByteLengthQueuingStrategy");
            options2 = convertQueuingStrategyInit(options2, "First parameter");
            this._byteLengthQueuingStrategyHighWaterMark = options2.highWaterMark;
          }
          get highWaterMark() {
            if (!IsByteLengthQueuingStrategy(this)) {
              throw byteLengthBrandCheckException("highWaterMark");
            }
            return this._byteLengthQueuingStrategyHighWaterMark;
          }
          get size() {
            if (!IsByteLengthQueuingStrategy(this)) {
              throw byteLengthBrandCheckException("size");
            }
            return byteLengthSizeFunction;
          }
        }
        Object.defineProperties(ByteLengthQueuingStrategy.prototype, {
          highWaterMark: { enumerable: true },
          size: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(ByteLengthQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
            value: "ByteLengthQueuingStrategy",
            configurable: true
          });
        }
        function byteLengthBrandCheckException(name) {
          return new TypeError(`ByteLengthQueuingStrategy.prototype.${name} can only be used on a ByteLengthQueuingStrategy`);
        }
        function IsByteLengthQueuingStrategy(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_byteLengthQueuingStrategyHighWaterMark")) {
            return false;
          }
          return x instanceof ByteLengthQueuingStrategy;
        }
        const countSizeFunction = () => {
          return 1;
        };
        Object.defineProperty(countSizeFunction, "name", {
          value: "size",
          configurable: true
        });
        class CountQueuingStrategy {
          constructor(options2) {
            assertRequiredArgument(options2, 1, "CountQueuingStrategy");
            options2 = convertQueuingStrategyInit(options2, "First parameter");
            this._countQueuingStrategyHighWaterMark = options2.highWaterMark;
          }
          get highWaterMark() {
            if (!IsCountQueuingStrategy(this)) {
              throw countBrandCheckException("highWaterMark");
            }
            return this._countQueuingStrategyHighWaterMark;
          }
          get size() {
            if (!IsCountQueuingStrategy(this)) {
              throw countBrandCheckException("size");
            }
            return countSizeFunction;
          }
        }
        Object.defineProperties(CountQueuingStrategy.prototype, {
          highWaterMark: { enumerable: true },
          size: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(CountQueuingStrategy.prototype, SymbolPolyfill.toStringTag, {
            value: "CountQueuingStrategy",
            configurable: true
          });
        }
        function countBrandCheckException(name) {
          return new TypeError(`CountQueuingStrategy.prototype.${name} can only be used on a CountQueuingStrategy`);
        }
        function IsCountQueuingStrategy(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_countQueuingStrategyHighWaterMark")) {
            return false;
          }
          return x instanceof CountQueuingStrategy;
        }
        function convertTransformer(original, context) {
          assertDictionary(original, context);
          const flush2 = original === null || original === void 0 ? void 0 : original.flush;
          const readableType = original === null || original === void 0 ? void 0 : original.readableType;
          const start = original === null || original === void 0 ? void 0 : original.start;
          const transform2 = original === null || original === void 0 ? void 0 : original.transform;
          const writableType = original === null || original === void 0 ? void 0 : original.writableType;
          return {
            flush: flush2 === void 0 ? void 0 : convertTransformerFlushCallback(flush2, original, `${context} has member 'flush' that`),
            readableType,
            start: start === void 0 ? void 0 : convertTransformerStartCallback(start, original, `${context} has member 'start' that`),
            transform: transform2 === void 0 ? void 0 : convertTransformerTransformCallback(transform2, original, `${context} has member 'transform' that`),
            writableType
          };
        }
        function convertTransformerFlushCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => promiseCall(fn, original, [controller]);
        }
        function convertTransformerStartCallback(fn, original, context) {
          assertFunction(fn, context);
          return (controller) => reflectCall(fn, original, [controller]);
        }
        function convertTransformerTransformCallback(fn, original, context) {
          assertFunction(fn, context);
          return (chunk, controller) => promiseCall(fn, original, [chunk, controller]);
        }
        class TransformStream {
          constructor(rawTransformer = {}, rawWritableStrategy = {}, rawReadableStrategy = {}) {
            if (rawTransformer === void 0) {
              rawTransformer = null;
            }
            const writableStrategy = convertQueuingStrategy(rawWritableStrategy, "Second parameter");
            const readableStrategy = convertQueuingStrategy(rawReadableStrategy, "Third parameter");
            const transformer = convertTransformer(rawTransformer, "First parameter");
            if (transformer.readableType !== void 0) {
              throw new RangeError("Invalid readableType specified");
            }
            if (transformer.writableType !== void 0) {
              throw new RangeError("Invalid writableType specified");
            }
            const readableHighWaterMark = ExtractHighWaterMark(readableStrategy, 0);
            const readableSizeAlgorithm = ExtractSizeAlgorithm(readableStrategy);
            const writableHighWaterMark = ExtractHighWaterMark(writableStrategy, 1);
            const writableSizeAlgorithm = ExtractSizeAlgorithm(writableStrategy);
            let startPromise_resolve;
            const startPromise = newPromise((resolve2) => {
              startPromise_resolve = resolve2;
            });
            InitializeTransformStream(this, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
            SetUpTransformStreamDefaultControllerFromTransformer(this, transformer);
            if (transformer.start !== void 0) {
              startPromise_resolve(transformer.start(this._transformStreamController));
            } else {
              startPromise_resolve(void 0);
            }
          }
          get readable() {
            if (!IsTransformStream(this)) {
              throw streamBrandCheckException("readable");
            }
            return this._readable;
          }
          get writable() {
            if (!IsTransformStream(this)) {
              throw streamBrandCheckException("writable");
            }
            return this._writable;
          }
        }
        Object.defineProperties(TransformStream.prototype, {
          readable: { enumerable: true },
          writable: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(TransformStream.prototype, SymbolPolyfill.toStringTag, {
            value: "TransformStream",
            configurable: true
          });
        }
        function InitializeTransformStream(stream, startPromise, writableHighWaterMark, writableSizeAlgorithm, readableHighWaterMark, readableSizeAlgorithm) {
          function startAlgorithm() {
            return startPromise;
          }
          function writeAlgorithm(chunk) {
            return TransformStreamDefaultSinkWriteAlgorithm(stream, chunk);
          }
          function abortAlgorithm(reason) {
            return TransformStreamDefaultSinkAbortAlgorithm(stream, reason);
          }
          function closeAlgorithm() {
            return TransformStreamDefaultSinkCloseAlgorithm(stream);
          }
          stream._writable = CreateWritableStream(startAlgorithm, writeAlgorithm, closeAlgorithm, abortAlgorithm, writableHighWaterMark, writableSizeAlgorithm);
          function pullAlgorithm() {
            return TransformStreamDefaultSourcePullAlgorithm(stream);
          }
          function cancelAlgorithm(reason) {
            TransformStreamErrorWritableAndUnblockWrite(stream, reason);
            return promiseResolvedWith(void 0);
          }
          stream._readable = CreateReadableStream(startAlgorithm, pullAlgorithm, cancelAlgorithm, readableHighWaterMark, readableSizeAlgorithm);
          stream._backpressure = void 0;
          stream._backpressureChangePromise = void 0;
          stream._backpressureChangePromise_resolve = void 0;
          TransformStreamSetBackpressure(stream, true);
          stream._transformStreamController = void 0;
        }
        function IsTransformStream(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_transformStreamController")) {
            return false;
          }
          return x instanceof TransformStream;
        }
        function TransformStreamError(stream, e) {
          ReadableStreamDefaultControllerError(stream._readable._readableStreamController, e);
          TransformStreamErrorWritableAndUnblockWrite(stream, e);
        }
        function TransformStreamErrorWritableAndUnblockWrite(stream, e) {
          TransformStreamDefaultControllerClearAlgorithms(stream._transformStreamController);
          WritableStreamDefaultControllerErrorIfNeeded(stream._writable._writableStreamController, e);
          if (stream._backpressure) {
            TransformStreamSetBackpressure(stream, false);
          }
        }
        function TransformStreamSetBackpressure(stream, backpressure) {
          if (stream._backpressureChangePromise !== void 0) {
            stream._backpressureChangePromise_resolve();
          }
          stream._backpressureChangePromise = newPromise((resolve2) => {
            stream._backpressureChangePromise_resolve = resolve2;
          });
          stream._backpressure = backpressure;
        }
        class TransformStreamDefaultController {
          constructor() {
            throw new TypeError("Illegal constructor");
          }
          get desiredSize() {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("desiredSize");
            }
            const readableController = this._controlledTransformStream._readable._readableStreamController;
            return ReadableStreamDefaultControllerGetDesiredSize(readableController);
          }
          enqueue(chunk = void 0) {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("enqueue");
            }
            TransformStreamDefaultControllerEnqueue(this, chunk);
          }
          error(reason = void 0) {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("error");
            }
            TransformStreamDefaultControllerError(this, reason);
          }
          terminate() {
            if (!IsTransformStreamDefaultController(this)) {
              throw defaultControllerBrandCheckException("terminate");
            }
            TransformStreamDefaultControllerTerminate(this);
          }
        }
        Object.defineProperties(TransformStreamDefaultController.prototype, {
          enqueue: { enumerable: true },
          error: { enumerable: true },
          terminate: { enumerable: true },
          desiredSize: { enumerable: true }
        });
        if (typeof SymbolPolyfill.toStringTag === "symbol") {
          Object.defineProperty(TransformStreamDefaultController.prototype, SymbolPolyfill.toStringTag, {
            value: "TransformStreamDefaultController",
            configurable: true
          });
        }
        function IsTransformStreamDefaultController(x) {
          if (!typeIsObject(x)) {
            return false;
          }
          if (!Object.prototype.hasOwnProperty.call(x, "_controlledTransformStream")) {
            return false;
          }
          return x instanceof TransformStreamDefaultController;
        }
        function SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm) {
          controller._controlledTransformStream = stream;
          stream._transformStreamController = controller;
          controller._transformAlgorithm = transformAlgorithm;
          controller._flushAlgorithm = flushAlgorithm;
        }
        function SetUpTransformStreamDefaultControllerFromTransformer(stream, transformer) {
          const controller = Object.create(TransformStreamDefaultController.prototype);
          let transformAlgorithm = (chunk) => {
            try {
              TransformStreamDefaultControllerEnqueue(controller, chunk);
              return promiseResolvedWith(void 0);
            } catch (transformResultE) {
              return promiseRejectedWith(transformResultE);
            }
          };
          let flushAlgorithm = () => promiseResolvedWith(void 0);
          if (transformer.transform !== void 0) {
            transformAlgorithm = (chunk) => transformer.transform(chunk, controller);
          }
          if (transformer.flush !== void 0) {
            flushAlgorithm = () => transformer.flush(controller);
          }
          SetUpTransformStreamDefaultController(stream, controller, transformAlgorithm, flushAlgorithm);
        }
        function TransformStreamDefaultControllerClearAlgorithms(controller) {
          controller._transformAlgorithm = void 0;
          controller._flushAlgorithm = void 0;
        }
        function TransformStreamDefaultControllerEnqueue(controller, chunk) {
          const stream = controller._controlledTransformStream;
          const readableController = stream._readable._readableStreamController;
          if (!ReadableStreamDefaultControllerCanCloseOrEnqueue(readableController)) {
            throw new TypeError("Readable side is not in a state that permits enqueue");
          }
          try {
            ReadableStreamDefaultControllerEnqueue(readableController, chunk);
          } catch (e) {
            TransformStreamErrorWritableAndUnblockWrite(stream, e);
            throw stream._readable._storedError;
          }
          const backpressure = ReadableStreamDefaultControllerHasBackpressure(readableController);
          if (backpressure !== stream._backpressure) {
            TransformStreamSetBackpressure(stream, true);
          }
        }
        function TransformStreamDefaultControllerError(controller, e) {
          TransformStreamError(controller._controlledTransformStream, e);
        }
        function TransformStreamDefaultControllerPerformTransform(controller, chunk) {
          const transformPromise = controller._transformAlgorithm(chunk);
          return transformPromiseWith(transformPromise, void 0, (r) => {
            TransformStreamError(controller._controlledTransformStream, r);
            throw r;
          });
        }
        function TransformStreamDefaultControllerTerminate(controller) {
          const stream = controller._controlledTransformStream;
          const readableController = stream._readable._readableStreamController;
          ReadableStreamDefaultControllerClose(readableController);
          const error2 = new TypeError("TransformStream terminated");
          TransformStreamErrorWritableAndUnblockWrite(stream, error2);
        }
        function TransformStreamDefaultSinkWriteAlgorithm(stream, chunk) {
          const controller = stream._transformStreamController;
          if (stream._backpressure) {
            const backpressureChangePromise = stream._backpressureChangePromise;
            return transformPromiseWith(backpressureChangePromise, () => {
              const writable3 = stream._writable;
              const state = writable3._state;
              if (state === "erroring") {
                throw writable3._storedError;
              }
              return TransformStreamDefaultControllerPerformTransform(controller, chunk);
            });
          }
          return TransformStreamDefaultControllerPerformTransform(controller, chunk);
        }
        function TransformStreamDefaultSinkAbortAlgorithm(stream, reason) {
          TransformStreamError(stream, reason);
          return promiseResolvedWith(void 0);
        }
        function TransformStreamDefaultSinkCloseAlgorithm(stream) {
          const readable2 = stream._readable;
          const controller = stream._transformStreamController;
          const flushPromise = controller._flushAlgorithm();
          TransformStreamDefaultControllerClearAlgorithms(controller);
          return transformPromiseWith(flushPromise, () => {
            if (readable2._state === "errored") {
              throw readable2._storedError;
            }
            ReadableStreamDefaultControllerClose(readable2._readableStreamController);
          }, (r) => {
            TransformStreamError(stream, r);
            throw readable2._storedError;
          });
        }
        function TransformStreamDefaultSourcePullAlgorithm(stream) {
          TransformStreamSetBackpressure(stream, false);
          return stream._backpressureChangePromise;
        }
        function defaultControllerBrandCheckException(name) {
          return new TypeError(`TransformStreamDefaultController.prototype.${name} can only be used on a TransformStreamDefaultController`);
        }
        function streamBrandCheckException(name) {
          return new TypeError(`TransformStream.prototype.${name} can only be used on a TransformStream`);
        }
        exports2.ByteLengthQueuingStrategy = ByteLengthQueuingStrategy;
        exports2.CountQueuingStrategy = CountQueuingStrategy;
        exports2.ReadableByteStreamController = ReadableByteStreamController;
        exports2.ReadableStream = ReadableStream2;
        exports2.ReadableStreamBYOBReader = ReadableStreamBYOBReader;
        exports2.ReadableStreamBYOBRequest = ReadableStreamBYOBRequest;
        exports2.ReadableStreamDefaultController = ReadableStreamDefaultController;
        exports2.ReadableStreamDefaultReader = ReadableStreamDefaultReader;
        exports2.TransformStream = TransformStream;
        exports2.TransformStreamDefaultController = TransformStreamDefaultController;
        exports2.WritableStream = WritableStream;
        exports2.WritableStreamDefaultController = WritableStreamDefaultController;
        exports2.WritableStreamDefaultWriter = WritableStreamDefaultWriter;
        Object.defineProperty(exports2, "__esModule", { value: true });
      });
    })(ponyfill_es2018, ponyfill_es2018.exports);
    POOL_SIZE$1 = 65536;
    if (!globalThis.ReadableStream) {
      try {
        const process2 = require("node:process");
        const { emitWarning } = process2;
        try {
          process2.emitWarning = () => {
          };
          Object.assign(globalThis, require("node:stream/web"));
          process2.emitWarning = emitWarning;
        } catch (error2) {
          process2.emitWarning = emitWarning;
          throw error2;
        }
      } catch (error2) {
        Object.assign(globalThis, ponyfill_es2018.exports);
      }
    }
    try {
      const { Blob: Blob3 } = require("buffer");
      if (Blob3 && !Blob3.prototype.stream) {
        Blob3.prototype.stream = function name(params) {
          let position = 0;
          const blob = this;
          return new ReadableStream({
            type: "bytes",
            async pull(ctrl) {
              const chunk = blob.slice(position, Math.min(blob.size, position + POOL_SIZE$1));
              const buffer = await chunk.arrayBuffer();
              position += buffer.byteLength;
              ctrl.enqueue(new Uint8Array(buffer));
              if (position === blob.size) {
                ctrl.close();
              }
            }
          });
        };
      }
    } catch (error2) {
    }
    POOL_SIZE = 65536;
    _Blob = class Blob {
      #parts = [];
      #type = "";
      #size = 0;
      constructor(blobParts = [], options2 = {}) {
        if (typeof blobParts !== "object" || blobParts === null) {
          throw new TypeError("Failed to construct 'Blob': The provided value cannot be converted to a sequence.");
        }
        if (typeof blobParts[Symbol.iterator] !== "function") {
          throw new TypeError("Failed to construct 'Blob': The object must have a callable @@iterator property.");
        }
        if (typeof options2 !== "object" && typeof options2 !== "function") {
          throw new TypeError("Failed to construct 'Blob': parameter 2 cannot convert to dictionary.");
        }
        if (options2 === null)
          options2 = {};
        const encoder = new TextEncoder();
        for (const element of blobParts) {
          let part;
          if (ArrayBuffer.isView(element)) {
            part = new Uint8Array(element.buffer.slice(element.byteOffset, element.byteOffset + element.byteLength));
          } else if (element instanceof ArrayBuffer) {
            part = new Uint8Array(element.slice(0));
          } else if (element instanceof Blob) {
            part = element;
          } else {
            part = encoder.encode(element);
          }
          this.#size += ArrayBuffer.isView(part) ? part.byteLength : part.size;
          this.#parts.push(part);
        }
        const type = options2.type === void 0 ? "" : String(options2.type);
        this.#type = /^[\x20-\x7E]*$/.test(type) ? type : "";
      }
      get size() {
        return this.#size;
      }
      get type() {
        return this.#type;
      }
      async text() {
        const decoder = new TextDecoder();
        let str = "";
        for await (const part of toIterator(this.#parts, false)) {
          str += decoder.decode(part, { stream: true });
        }
        str += decoder.decode();
        return str;
      }
      async arrayBuffer() {
        const data = new Uint8Array(this.size);
        let offset2 = 0;
        for await (const chunk of toIterator(this.#parts, false)) {
          data.set(chunk, offset2);
          offset2 += chunk.length;
        }
        return data.buffer;
      }
      stream() {
        const it = toIterator(this.#parts, true);
        return new globalThis.ReadableStream({
          type: "bytes",
          async pull(ctrl) {
            const chunk = await it.next();
            chunk.done ? ctrl.close() : ctrl.enqueue(chunk.value);
          },
          async cancel() {
            await it.return();
          }
        });
      }
      slice(start = 0, end = this.size, type = "") {
        const { size } = this;
        let relativeStart = start < 0 ? Math.max(size + start, 0) : Math.min(start, size);
        let relativeEnd = end < 0 ? Math.max(size + end, 0) : Math.min(end, size);
        const span = Math.max(relativeEnd - relativeStart, 0);
        const parts = this.#parts;
        const blobParts = [];
        let added = 0;
        for (const part of parts) {
          if (added >= span) {
            break;
          }
          const size2 = ArrayBuffer.isView(part) ? part.byteLength : part.size;
          if (relativeStart && size2 <= relativeStart) {
            relativeStart -= size2;
            relativeEnd -= size2;
          } else {
            let chunk;
            if (ArrayBuffer.isView(part)) {
              chunk = part.subarray(relativeStart, Math.min(size2, relativeEnd));
              added += chunk.byteLength;
            } else {
              chunk = part.slice(relativeStart, Math.min(size2, relativeEnd));
              added += chunk.size;
            }
            relativeEnd -= size2;
            blobParts.push(chunk);
            relativeStart = 0;
          }
        }
        const blob = new Blob([], { type: String(type).toLowerCase() });
        blob.#size = span;
        blob.#parts = blobParts;
        return blob;
      }
      get [Symbol.toStringTag]() {
        return "Blob";
      }
      static [Symbol.hasInstance](object) {
        return object && typeof object === "object" && typeof object.constructor === "function" && (typeof object.stream === "function" || typeof object.arrayBuffer === "function") && /^(Blob|File)$/.test(object[Symbol.toStringTag]);
      }
    };
    Object.defineProperties(_Blob.prototype, {
      size: { enumerable: true },
      type: { enumerable: true },
      slice: { enumerable: true }
    });
    Blob2 = _Blob;
    Blob$1 = Blob2;
    FetchBaseError = class extends Error {
      constructor(message, type) {
        super(message);
        Error.captureStackTrace(this, this.constructor);
        this.type = type;
      }
      get name() {
        return this.constructor.name;
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
    };
    FetchError = class extends FetchBaseError {
      constructor(message, type, systemError) {
        super(message, type);
        if (systemError) {
          this.code = this.errno = systemError.code;
          this.erroredSysCall = systemError.syscall;
        }
      }
    };
    NAME = Symbol.toStringTag;
    isURLSearchParameters = (object) => {
      return typeof object === "object" && typeof object.append === "function" && typeof object.delete === "function" && typeof object.get === "function" && typeof object.getAll === "function" && typeof object.has === "function" && typeof object.set === "function" && typeof object.sort === "function" && object[NAME] === "URLSearchParams";
    };
    isBlob = (object) => {
      return typeof object === "object" && typeof object.arrayBuffer === "function" && typeof object.type === "string" && typeof object.stream === "function" && typeof object.constructor === "function" && /^(Blob|File)$/.test(object[NAME]);
    };
    isAbortSignal = (object) => {
      return typeof object === "object" && (object[NAME] === "AbortSignal" || object[NAME] === "EventTarget");
    };
    carriage = "\r\n";
    dashes = "-".repeat(2);
    carriageLength = Buffer.byteLength(carriage);
    getFooter = (boundary) => `${dashes}${boundary}${dashes}${carriage.repeat(2)}`;
    getBoundary = () => (0, import_crypto.randomBytes)(8).toString("hex");
    INTERNALS$2 = Symbol("Body internals");
    Body = class {
      constructor(body, {
        size = 0
      } = {}) {
        let boundary = null;
        if (body === null) {
          body = null;
        } else if (isURLSearchParameters(body)) {
          body = Buffer.from(body.toString());
        } else if (isBlob(body))
          ;
        else if (Buffer.isBuffer(body))
          ;
        else if (import_util.types.isAnyArrayBuffer(body)) {
          body = Buffer.from(body);
        } else if (ArrayBuffer.isView(body)) {
          body = Buffer.from(body.buffer, body.byteOffset, body.byteLength);
        } else if (body instanceof import_stream.default)
          ;
        else if (isFormData(body)) {
          boundary = `NodeFetchFormDataBoundary${getBoundary()}`;
          body = import_stream.default.Readable.from(formDataIterator(body, boundary));
        } else {
          body = Buffer.from(String(body));
        }
        this[INTERNALS$2] = {
          body,
          boundary,
          disturbed: false,
          error: null
        };
        this.size = size;
        if (body instanceof import_stream.default) {
          body.on("error", (error_) => {
            const error2 = error_ instanceof FetchBaseError ? error_ : new FetchError(`Invalid response body while trying to fetch ${this.url}: ${error_.message}`, "system", error_);
            this[INTERNALS$2].error = error2;
          });
        }
      }
      get body() {
        return this[INTERNALS$2].body;
      }
      get bodyUsed() {
        return this[INTERNALS$2].disturbed;
      }
      async arrayBuffer() {
        const { buffer, byteOffset, byteLength } = await consumeBody(this);
        return buffer.slice(byteOffset, byteOffset + byteLength);
      }
      async blob() {
        const ct = this.headers && this.headers.get("content-type") || this[INTERNALS$2].body && this[INTERNALS$2].body.type || "";
        const buf = await this.buffer();
        return new Blob$1([buf], {
          type: ct
        });
      }
      async json() {
        const buffer = await consumeBody(this);
        return JSON.parse(buffer.toString());
      }
      async text() {
        const buffer = await consumeBody(this);
        return buffer.toString();
      }
      buffer() {
        return consumeBody(this);
      }
    };
    Object.defineProperties(Body.prototype, {
      body: { enumerable: true },
      bodyUsed: { enumerable: true },
      arrayBuffer: { enumerable: true },
      blob: { enumerable: true },
      json: { enumerable: true },
      text: { enumerable: true }
    });
    clone = (instance, highWaterMark) => {
      let p1;
      let p2;
      let { body } = instance;
      if (instance.bodyUsed) {
        throw new Error("cannot clone body after it is used");
      }
      if (body instanceof import_stream.default && typeof body.getBoundary !== "function") {
        p1 = new import_stream.PassThrough({ highWaterMark });
        p2 = new import_stream.PassThrough({ highWaterMark });
        body.pipe(p1);
        body.pipe(p2);
        instance[INTERNALS$2].body = p1;
        body = p2;
      }
      return body;
    };
    extractContentType = (body, request) => {
      if (body === null) {
        return null;
      }
      if (typeof body === "string") {
        return "text/plain;charset=UTF-8";
      }
      if (isURLSearchParameters(body)) {
        return "application/x-www-form-urlencoded;charset=UTF-8";
      }
      if (isBlob(body)) {
        return body.type || null;
      }
      if (Buffer.isBuffer(body) || import_util.types.isAnyArrayBuffer(body) || ArrayBuffer.isView(body)) {
        return null;
      }
      if (body && typeof body.getBoundary === "function") {
        return `multipart/form-data;boundary=${body.getBoundary()}`;
      }
      if (isFormData(body)) {
        return `multipart/form-data; boundary=${request[INTERNALS$2].boundary}`;
      }
      if (body instanceof import_stream.default) {
        return null;
      }
      return "text/plain;charset=UTF-8";
    };
    getTotalBytes = (request) => {
      const { body } = request;
      if (body === null) {
        return 0;
      }
      if (isBlob(body)) {
        return body.size;
      }
      if (Buffer.isBuffer(body)) {
        return body.length;
      }
      if (body && typeof body.getLengthSync === "function") {
        return body.hasKnownLength && body.hasKnownLength() ? body.getLengthSync() : null;
      }
      if (isFormData(body)) {
        return getFormDataLength(request[INTERNALS$2].boundary);
      }
      return null;
    };
    writeToStream = (dest, { body }) => {
      if (body === null) {
        dest.end();
      } else if (isBlob(body)) {
        import_stream.default.Readable.from(body.stream()).pipe(dest);
      } else if (Buffer.isBuffer(body)) {
        dest.write(body);
        dest.end();
      } else {
        body.pipe(dest);
      }
    };
    validateHeaderName = typeof import_http.default.validateHeaderName === "function" ? import_http.default.validateHeaderName : (name) => {
      if (!/^[\^`\-\w!#$%&'*+.|~]+$/.test(name)) {
        const error2 = new TypeError(`Header name must be a valid HTTP token [${name}]`);
        Object.defineProperty(error2, "code", { value: "ERR_INVALID_HTTP_TOKEN" });
        throw error2;
      }
    };
    validateHeaderValue = typeof import_http.default.validateHeaderValue === "function" ? import_http.default.validateHeaderValue : (name, value) => {
      if (/[^\t\u0020-\u007E\u0080-\u00FF]/.test(value)) {
        const error2 = new TypeError(`Invalid character in header content ["${name}"]`);
        Object.defineProperty(error2, "code", { value: "ERR_INVALID_CHAR" });
        throw error2;
      }
    };
    Headers = class extends URLSearchParams {
      constructor(init2) {
        let result = [];
        if (init2 instanceof Headers) {
          const raw = init2.raw();
          for (const [name, values] of Object.entries(raw)) {
            result.push(...values.map((value) => [name, value]));
          }
        } else if (init2 == null)
          ;
        else if (typeof init2 === "object" && !import_util.types.isBoxedPrimitive(init2)) {
          const method = init2[Symbol.iterator];
          if (method == null) {
            result.push(...Object.entries(init2));
          } else {
            if (typeof method !== "function") {
              throw new TypeError("Header pairs must be iterable");
            }
            result = [...init2].map((pair) => {
              if (typeof pair !== "object" || import_util.types.isBoxedPrimitive(pair)) {
                throw new TypeError("Each header pair must be an iterable object");
              }
              return [...pair];
            }).map((pair) => {
              if (pair.length !== 2) {
                throw new TypeError("Each header pair must be a name/value tuple");
              }
              return [...pair];
            });
          }
        } else {
          throw new TypeError("Failed to construct 'Headers': The provided value is not of type '(sequence<sequence<ByteString>> or record<ByteString, ByteString>)");
        }
        result = result.length > 0 ? result.map(([name, value]) => {
          validateHeaderName(name);
          validateHeaderValue(name, String(value));
          return [String(name).toLowerCase(), String(value)];
        }) : void 0;
        super(result);
        return new Proxy(this, {
          get(target, p, receiver) {
            switch (p) {
              case "append":
              case "set":
                return (name, value) => {
                  validateHeaderName(name);
                  validateHeaderValue(name, String(value));
                  return URLSearchParams.prototype[p].call(target, String(name).toLowerCase(), String(value));
                };
              case "delete":
              case "has":
              case "getAll":
                return (name) => {
                  validateHeaderName(name);
                  return URLSearchParams.prototype[p].call(target, String(name).toLowerCase());
                };
              case "keys":
                return () => {
                  target.sort();
                  return new Set(URLSearchParams.prototype.keys.call(target)).keys();
                };
              default:
                return Reflect.get(target, p, receiver);
            }
          }
        });
      }
      get [Symbol.toStringTag]() {
        return this.constructor.name;
      }
      toString() {
        return Object.prototype.toString.call(this);
      }
      get(name) {
        const values = this.getAll(name);
        if (values.length === 0) {
          return null;
        }
        let value = values.join(", ");
        if (/^content-encoding$/i.test(name)) {
          value = value.toLowerCase();
        }
        return value;
      }
      forEach(callback, thisArg = void 0) {
        for (const name of this.keys()) {
          Reflect.apply(callback, thisArg, [this.get(name), name, this]);
        }
      }
      *values() {
        for (const name of this.keys()) {
          yield this.get(name);
        }
      }
      *entries() {
        for (const name of this.keys()) {
          yield [name, this.get(name)];
        }
      }
      [Symbol.iterator]() {
        return this.entries();
      }
      raw() {
        return [...this.keys()].reduce((result, key) => {
          result[key] = this.getAll(key);
          return result;
        }, {});
      }
      [Symbol.for("nodejs.util.inspect.custom")]() {
        return [...this.keys()].reduce((result, key) => {
          const values = this.getAll(key);
          if (key === "host") {
            result[key] = values[0];
          } else {
            result[key] = values.length > 1 ? values : values[0];
          }
          return result;
        }, {});
      }
    };
    Object.defineProperties(Headers.prototype, ["get", "entries", "forEach", "values"].reduce((result, property) => {
      result[property] = { enumerable: true };
      return result;
    }, {}));
    redirectStatus = new Set([301, 302, 303, 307, 308]);
    isRedirect = (code) => {
      return redirectStatus.has(code);
    };
    INTERNALS$1 = Symbol("Response internals");
    Response = class extends Body {
      constructor(body = null, options2 = {}) {
        super(body, options2);
        const status = options2.status != null ? options2.status : 200;
        const headers = new Headers(options2.headers);
        if (body !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(body);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        this[INTERNALS$1] = {
          type: "default",
          url: options2.url,
          status,
          statusText: options2.statusText || "",
          headers,
          counter: options2.counter,
          highWaterMark: options2.highWaterMark
        };
      }
      get type() {
        return this[INTERNALS$1].type;
      }
      get url() {
        return this[INTERNALS$1].url || "";
      }
      get status() {
        return this[INTERNALS$1].status;
      }
      get ok() {
        return this[INTERNALS$1].status >= 200 && this[INTERNALS$1].status < 300;
      }
      get redirected() {
        return this[INTERNALS$1].counter > 0;
      }
      get statusText() {
        return this[INTERNALS$1].statusText;
      }
      get headers() {
        return this[INTERNALS$1].headers;
      }
      get highWaterMark() {
        return this[INTERNALS$1].highWaterMark;
      }
      clone() {
        return new Response(clone(this, this.highWaterMark), {
          type: this.type,
          url: this.url,
          status: this.status,
          statusText: this.statusText,
          headers: this.headers,
          ok: this.ok,
          redirected: this.redirected,
          size: this.size
        });
      }
      static redirect(url2, status = 302) {
        if (!isRedirect(status)) {
          throw new RangeError('Failed to execute "redirect" on "response": Invalid status code');
        }
        return new Response(null, {
          headers: {
            location: new URL(url2).toString()
          },
          status
        });
      }
      static error() {
        const response = new Response(null, { status: 0, statusText: "" });
        response[INTERNALS$1].type = "error";
        return response;
      }
      get [Symbol.toStringTag]() {
        return "Response";
      }
    };
    Object.defineProperties(Response.prototype, {
      type: { enumerable: true },
      url: { enumerable: true },
      status: { enumerable: true },
      ok: { enumerable: true },
      redirected: { enumerable: true },
      statusText: { enumerable: true },
      headers: { enumerable: true },
      clone: { enumerable: true }
    });
    getSearch = (parsedURL) => {
      if (parsedURL.search) {
        return parsedURL.search;
      }
      const lastOffset = parsedURL.href.length - 1;
      const hash2 = parsedURL.hash || (parsedURL.href[lastOffset] === "#" ? "#" : "");
      return parsedURL.href[lastOffset - hash2.length] === "?" ? "?" : "";
    };
    INTERNALS = Symbol("Request internals");
    isRequest = (object) => {
      return typeof object === "object" && typeof object[INTERNALS] === "object";
    };
    Request = class extends Body {
      constructor(input, init2 = {}) {
        let parsedURL;
        if (isRequest(input)) {
          parsedURL = new URL(input.url);
        } else {
          parsedURL = new URL(input);
          input = {};
        }
        let method = init2.method || input.method || "GET";
        method = method.toUpperCase();
        if ((init2.body != null || isRequest(input)) && input.body !== null && (method === "GET" || method === "HEAD")) {
          throw new TypeError("Request with GET/HEAD method cannot have body");
        }
        const inputBody = init2.body ? init2.body : isRequest(input) && input.body !== null ? clone(input) : null;
        super(inputBody, {
          size: init2.size || input.size || 0
        });
        const headers = new Headers(init2.headers || input.headers || {});
        if (inputBody !== null && !headers.has("Content-Type")) {
          const contentType = extractContentType(inputBody, this);
          if (contentType) {
            headers.append("Content-Type", contentType);
          }
        }
        let signal = isRequest(input) ? input.signal : null;
        if ("signal" in init2) {
          signal = init2.signal;
        }
        if (signal != null && !isAbortSignal(signal)) {
          throw new TypeError("Expected signal to be an instanceof AbortSignal or EventTarget");
        }
        this[INTERNALS] = {
          method,
          redirect: init2.redirect || input.redirect || "follow",
          headers,
          parsedURL,
          signal
        };
        this.follow = init2.follow === void 0 ? input.follow === void 0 ? 20 : input.follow : init2.follow;
        this.compress = init2.compress === void 0 ? input.compress === void 0 ? true : input.compress : init2.compress;
        this.counter = init2.counter || input.counter || 0;
        this.agent = init2.agent || input.agent;
        this.highWaterMark = init2.highWaterMark || input.highWaterMark || 16384;
        this.insecureHTTPParser = init2.insecureHTTPParser || input.insecureHTTPParser || false;
      }
      get method() {
        return this[INTERNALS].method;
      }
      get url() {
        return (0, import_url.format)(this[INTERNALS].parsedURL);
      }
      get headers() {
        return this[INTERNALS].headers;
      }
      get redirect() {
        return this[INTERNALS].redirect;
      }
      get signal() {
        return this[INTERNALS].signal;
      }
      clone() {
        return new Request(this);
      }
      get [Symbol.toStringTag]() {
        return "Request";
      }
    };
    Object.defineProperties(Request.prototype, {
      method: { enumerable: true },
      url: { enumerable: true },
      headers: { enumerable: true },
      redirect: { enumerable: true },
      clone: { enumerable: true },
      signal: { enumerable: true }
    });
    getNodeRequestOptions = (request) => {
      const { parsedURL } = request[INTERNALS];
      const headers = new Headers(request[INTERNALS].headers);
      if (!headers.has("Accept")) {
        headers.set("Accept", "*/*");
      }
      let contentLengthValue = null;
      if (request.body === null && /^(post|put)$/i.test(request.method)) {
        contentLengthValue = "0";
      }
      if (request.body !== null) {
        const totalBytes = getTotalBytes(request);
        if (typeof totalBytes === "number" && !Number.isNaN(totalBytes)) {
          contentLengthValue = String(totalBytes);
        }
      }
      if (contentLengthValue) {
        headers.set("Content-Length", contentLengthValue);
      }
      if (!headers.has("User-Agent")) {
        headers.set("User-Agent", "node-fetch");
      }
      if (request.compress && !headers.has("Accept-Encoding")) {
        headers.set("Accept-Encoding", "gzip,deflate,br");
      }
      let { agent } = request;
      if (typeof agent === "function") {
        agent = agent(parsedURL);
      }
      if (!headers.has("Connection") && !agent) {
        headers.set("Connection", "close");
      }
      const search = getSearch(parsedURL);
      const requestOptions = {
        path: parsedURL.pathname + search,
        pathname: parsedURL.pathname,
        hostname: parsedURL.hostname,
        protocol: parsedURL.protocol,
        port: parsedURL.port,
        hash: parsedURL.hash,
        search: parsedURL.search,
        query: parsedURL.query,
        href: parsedURL.href,
        method: request.method,
        headers: headers[Symbol.for("nodejs.util.inspect.custom")](),
        insecureHTTPParser: request.insecureHTTPParser,
        agent
      };
      return requestOptions;
    };
    AbortError = class extends FetchBaseError {
      constructor(message, type = "aborted") {
        super(message, type);
      }
    };
    supportedSchemas = new Set(["data:", "http:", "https:"]);
  }
});

// node_modules/@sveltejs/adapter-vercel/files/shims.js
var init_shims = __esm({
  "node_modules/@sveltejs/adapter-vercel/files/shims.js"() {
    init_install_fetch();
  }
});

// .svelte-kit/output/server/chunks/index-8f6e8620.js
function readable(value, start) {
  return {
    subscribe: writable(value, start).subscribe
  };
}
function writable(value, start = noop) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue.length; i += 2) {
            subscriber_queue[i][0](subscriber_queue[i + 1]);
          }
          subscriber_queue.length = 0;
        }
      }
    }
  }
  function update3(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update: update3, subscribe: subscribe2 };
}
function derived(stores, fn, initial_value) {
  const single = !Array.isArray(stores);
  const stores_array = single ? [stores] : stores;
  const auto = fn.length < 2;
  return readable(initial_value, (set) => {
    let inited = false;
    const values = [];
    let pending = 0;
    let cleanup = noop;
    const sync = () => {
      if (pending) {
        return;
      }
      cleanup();
      const result = fn(single ? values[0] : values, set);
      if (auto) {
        set(result);
      } else {
        cleanup = is_function(result) ? result : noop;
      }
    };
    const unsubscribers = stores_array.map((store, i) => subscribe(store, (value) => {
      values[i] = value;
      pending &= ~(1 << i);
      if (inited) {
        sync();
      }
    }, () => {
      pending |= 1 << i;
    }));
    inited = true;
    sync();
    return function stop() {
      run_all(unsubscribers);
      cleanup();
    };
  });
}
var subscriber_queue;
var init_index_8f6e8620 = __esm({
  ".svelte-kit/output/server/chunks/index-8f6e8620.js"() {
    init_shims();
    init_app_171d3477();
    subscriber_queue = [];
  }
});

// .svelte-kit/output/server/chunks/url-9b321f75.js
var url_9b321f75_exports = {};
__export(url_9b321f75_exports, {
  default: () => url
});
var isBrowser, href, url;
var init_url_9b321f75 = __esm({
  ".svelte-kit/output/server/chunks/url-9b321f75.js"() {
    init_shims();
    init_index_8f6e8620();
    init_app_171d3477();
    isBrowser = typeof window !== "undefined";
    href = writable(isBrowser ? window.location.href : "https://example.com");
    if (isBrowser) {
      const originalPushState = history.pushState;
      const originalReplaceState = history.replaceState;
      const updateHref = () => href.set(window.location.href);
      history.pushState = function() {
        originalPushState.apply(this, arguments);
        updateHref();
      };
      history.replaceState = function() {
        originalReplaceState.apply(this, arguments);
        updateHref();
      };
      window.addEventListener("popstate", updateHref);
      window.addEventListener("hashchange", updateHref);
    }
    url = {
      subscribe: derived(href, ($href) => new URL($href)).subscribe,
      ssrSet: (urlHref) => href.set(urlHref)
    };
  }
});

// .svelte-kit/output/server/chunks/layout-133469ff.js
var layout_133469ff_exports = {};
__export(layout_133469ff_exports, {
  default: () => Layout
});
var Layout;
var init_layout_133469ff = __esm({
  ".svelte-kit/output/server/chunks/layout-133469ff.js"() {
    init_shims();
    init_app_171d3477();
    Layout = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `${slots.default ? slots.default({}) : ``}`;
    });
  }
});

// .svelte-kit/output/server/chunks/error-2686f671.js
var error_2686f671_exports = {};
__export(error_2686f671_exports, {
  default: () => Error2,
  load: () => load
});
function load({ error: error2, status }) {
  return { props: { error: error2, status } };
}
var Error2;
var init_error_2686f671 = __esm({
  ".svelte-kit/output/server/chunks/error-2686f671.js"() {
    init_shims();
    init_app_171d3477();
    Error2 = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { status } = $$props;
      let { error: error2 } = $$props;
      if ($$props.status === void 0 && $$bindings.status && status !== void 0)
        $$bindings.status(status);
      if ($$props.error === void 0 && $$bindings.error && error2 !== void 0)
        $$bindings.error(error2);
      return `<h1>${escape(status)}</h1>

<pre>${escape(error2.message)}</pre>



${error2.frame ? `<pre>${escape(error2.frame)}</pre>` : ``}
${error2.stack ? `<pre>${escape(error2.stack)}</pre>` : ``}`;
    });
  }
});

// .svelte-kit/output/server/chunks/bridgetab-51870fe2.js
var bridgetab_51870fe2_exports = {};
__export(bridgetab_51870fe2_exports, {
  default: () => Bridgetab
});
var css, Bridgetab;
var init_bridgetab_51870fe2 = __esm({
  ".svelte-kit/output/server/chunks/bridgetab-51870fe2.js"() {
    init_shims();
    init_app_171d3477();
    css = {
      code: ".led.svelte-9xjqze{position:absolute}@media screen and (max-width: 640px){.led.svelte-9xjqze{position:relative}}@-webkit-keyframes svelte-9xjqze-loadingCircle{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@keyframes svelte-9xjqze-loadingCircle{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}",
      map: null
    };
    Bridgetab = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let number = 0;
      $$result.css.add(css);
      return `${$$result.head += ``, ""}
${``}
<div class="${"py-4 md:py-8 lg:py-12 max-w-2xl w-full"}" id="${"swap-page"}"><div class="${"relative w-full max-w-2xl"}"><div class="${"led top-1/4 -left-10 bg-blue bottom-4 w-3/5 rounded-full z-0 filter blur-[400px] svelte-9xjqze"}"></div>
		<div class="${"led bottom-1/4 -right-10 bg-pink top-4 w-3/5 rounded-full z-0 filter blur-[400px] svelte-9xjqze"}"></div>
		<div class="${"relative filter drop-shadow"}"><div class="${"p-4 space-y-4 rounded bg-dark-900 z-1"}"><div class="${"flex justify-between mb-4 space-x-3 items-center"}"><div class="${"flex items-center"}"></div></div>
				<div><div id="${"swap-currency-input"}" class="${"p-5 rounded bg-dark-800"}"><div class="${"flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row"}"><div class="${"w-full "}"><div class="${"text-primary1 h-full outline-none select-none text-xl font-medium "}"><div class="${"flex"}"><div class="${"flex items-center"}"><div class="${"rounded"}" style="${"width: 54px; height: 54px;"}"><div class="${"overflow-hidden rounded"}" style="${"width: 54px; height: 54px;"}"><div style="${"overflow: hidden; box-sizing: border-box; display: inline-block; position: relative; width: 54px; height: 54px;"}"><img alt="${"ETH"}" src="${"./favicon.png"}" decoding="${"async"}" data-nimg="${"fixed"}" class="${"rounded"}" style="${"position: absolute; inset: 0px; box-sizing: border-box; padding: 0px; border: none; margin: auto; display: block; width: 0px; height: 0px; min-width: 100%; max-width: 100%; min-height: 100%; max-height: 100%; filter: none; background-size: cover; background-image: none; background-position: 0% 0%;"}">
														<noscript></noscript></div></div></div></div>
										<div class="${"flex flex-1 flex-col items-start justify-center mx-3.5"}"><div class="${"flex items-center"}"><div class="${"text-4xl font-bold token-symbol-container "}">Noava Bridge</div></div></div></div>
									<div class="${"grid py-3"}"><div class="${"w-full flex p-0 Row__AutoRow-sc-18omu2-2 jQYXTF"}" style="${"padding: 0px 1rem;"}"></div></div>

									<div class="${"flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row"}"><div class="${"w-full "}"><div class="${"text-primary1 h-full outline-none select-none text-xl font-medium "}"><br>

												<div class="${"container"}"><div class="${"ant-row "}"><div class="${"ant-col-4"}"><img value="${"bsc"}" width="${"40px"}" src="${"https://img.api.cryptorank.io/exchanges/binance%20futures1605113349439.png"}" style="${"float: right; margin-right: 30px; margin-top: 5px;cursor: pointer;"}"></div>

														<div class="${"ant-col-19 "}"><div class="${"flex items-center w-full space-x-3 rounded bg-dark-900 focus:bg-dark-700 p-3 "}"><input oninput="${"tokens()"}" id="${"token-amount-input"}" inputmode="${"decimal"}" title="${"Token Amount"}" autocomplete="${"off"}" autocorrect="${"off"}" type="${"text"}" pattern="${"^[0-9]*[.,]?[0-9]*$"}" placeholder="${"0.0"}" min="${"0"}" minlength="${"1"}" maxlength="${"79"}" spellcheck="${"false"}" class="${"relative font-bold outline-none border-none flex-auto overflow-hidden overflow-ellipsis placeholder-low-emphesis focus:placeholder-primary w-0 p-0 text-2xl bg-transparent"}"${add_attribute("value", number, 0)}></div></div></div></div>

												<button class="${"z-10 -mt-6 -mb-6 rounded-full"}" style="${"margin-bottom: 5px; margin-top: 5px;"}"><div class="${"rounded-full bg-dark-900 p-3px"}"><div class="${"p-3 rounded-full bg-dark-800 hover:bg-dark-700"}"><div style="${"width: 32px; height: 32px;"}"><svg xmlns="${"http://www.w3.org/2000/svg"}" viewBox="${"0 0 500 500"}" width="${"500"}" height="${"500"}" preserveAspectRatio="${"xMidYMid meet"}" style="${"width: 100%; height: 100%; transform: translate3d(0px, 0px, 0px);"}"><defs><clipPath id="${"__lottie_element_248"}"><rect width="${"500"}" height="${"500"}" x="${"0"}" y="${"0"}"></rect></clipPath><clipPath id="${"__lottie_element_250"}"><path d="${"M0,0 L500,0 L500,500 L0,500z"}"></path></clipPath></defs><g clip-path="${"url(#__lottie_element_248)"}"><g transform="${"matrix(4.5,0,0,4.5,207.25,194.875)"}" opacity="${"1"}" style="${"display: block;"}"><g opacity="${"1"}" transform="${"matrix(1,0,0,1,0,0)"}"><path stroke-linecap="${"round"}" stroke-linejoin="${"round"}" fill-opacity="${"0"}" stroke="${"rgb(226,226,226)"}" stroke-opacity="${"1"}" stroke-width="${"5.6000000000000005"}" d="${" M28.945999145507812,-27.937000274658203 C28.966999053955078,-9.605999946594238 29.014999389648438,33.75299835205078 29.034000396728516,50.236000061035156"}"></path></g></g><g transform="${"matrix(3.1819803714752197,-3.1819803714752197,3.1819803714752197,3.1819803714752197,363.2012939453125,326.5682373046875)"}" opacity="${"1"}" style="${"display: block;"}"><g opacity="${"1"}" transform="${"matrix(1,0,0,1,0,0)"}"><path stroke-linecap="${"round"}" stroke-linejoin="${"round"}" fill-opacity="${"0"}" stroke="${"rgb(226,226,226)"}" stroke-opacity="${"1"}" stroke-width="${"5.6000000000000005"}" d="${" M-20.548999786376953,-4.929999828338623 C-20.548999786376953,-4.929999828338623 -20.548999786376953,12.746999740600586 -20.548999786376953,12.746999740600586 C-20.548999786376953,12.746999740600586 -2.927000045776367,12.746999740600586 -2.927000045776367,12.746999740600586"}"></path></g></g><g transform="${"matrix(-4.5,0,0,-4.5,292.75,305.125)"}" opacity="${"1"}" style="${"display: block;"}"><g opacity="${"1"}" transform="${"matrix(1,0,0,1,0,0)"}"><path stroke-linecap="${"round"}" stroke-linejoin="${"round"}" fill-opacity="${"0"}" stroke="${"rgb(226,226,226)"}" stroke-opacity="${"1"}" stroke-width="${"5.6000000000000005"}" d="${" M28.945999145507812,-27.937000274658203 C28.966999053955078,-9.605999946594238 29.014999389648438,33.75299835205078 29.034000396728516,50.236000061035156"}"></path></g></g><g transform="${"matrix(-3.1819803714752197,3.1819803714752197,-3.1819803714752197,-3.1819803714752197,136.79869079589844,173.43174743652344)"}" opacity="${"1"}" style="${"display: block;"}"><g opacity="${"1"}" transform="${"matrix(1,0,0,1,0,0)"}"><path stroke-linecap="${"round"}" stroke-linejoin="${"round"}" fill-opacity="${"0"}" stroke="${"rgb(226,226,226)"}" stroke-opacity="${"1"}" stroke-width="${"5.6000000000000005"}" d="${" M-20.548999786376953,-4.929999828338623 C-20.548999786376953,-4.929999828338623 -20.548999786376953,12.746999740600586 -20.548999786376953,12.746999740600586 C-20.548999786376953,12.746999740600586 -2.927000045776367,12.746999740600586 -2.927000045776367,12.746999740600586"}"></path></g></g><g clip-path="${"url(#__lottie_element_250)"}" transform="${"matrix(1,0,0,1,0,0)"}" opacity="${"1"}" style="${"display: block;"}"></g></g></svg></div></div></div></button>

												<div class="${"container"}"><div class="${"ant-row "}"><div class="${"ant-col-4 "}"><img src="${"https://app.sushi.com/_next/image?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsushiswap%2Ficons%2Fmaster%2Fnetwork%2Fpolygon.jpg&w=48&q=75"}" width="${"45px"}" style="${"float: right; margin-right: 30px; margin-top: 5px;"}"></div>
														<div class="${"ant-col-19 "}"><div class="${"flex items-center w-full space-x-3 rounded bg-dark-900 focus:bg-dark-700 p-3 "}"><input id="${"token-amount-output"}" inputmode="${"decimal"}" title="${"Token Amount"}" autocomplete="${"off"}" autocorrect="${"off"}" type="${"text"}" pattern="${"^[0-9]*[.,]?[0-9]*$"}" placeholder="${"0.0"}" min="${"0"}" minlength="${"1"}" maxlength="${"79"}" spellcheck="${"false"}" class="${"relative font-bold outline-none border-none flex-auto overflow-hidden overflow-ellipsis placeholder-low-emphesis focus:placeholder-primary w-0 p-0 text-2xl bg-transparent"}"${add_attribute("value", number, 0)}></div></div></div></div></div></div></div></div></div></div></div>

					<div class="${"grid py-3"}"><div class="${"w-full flex p-0 Row__AutoRow-sc-18omu2-2 jQYXTF"}" style="${"padding: 0px 1rem;"}"></div></div>

					<div class="${"styleds__BottomGrouping-sc-zj8gmh-4 fpacZx"}"><button class="${"w-full text-high-emphesis bg-gradient-to-r from-blue to-pink opacity-80 hover:opacity-100 disabled:bg-opacity-80 px-6 py-4 text-base rounded disabled:cursor-not-allowed focus:outline-none"}">Bridge
						</button></div></div></div></div></div>
</div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/bridge-a2406c9e.js
var bridge_a2406c9e_exports = {};
__export(bridge_a2406c9e_exports, {
  default: () => Bridge
});
var Bridge;
var init_bridge_a2406c9e = __esm({
  ".svelte-kit/output/server/chunks/bridge-a2406c9e.js"() {
    init_shims();
    init_app_171d3477();
    init_bridgetab_51870fe2();
    Bridge = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `${$$result.head += `<link rel="${"stylesheet"}" href="${"css.css"}" data-svelte="svelte-t1dehw">`, ""}

<div class="${"flex-col items-center justify-start flex-grow w-full h-full "}" style="${"height: max-content;"}"><div id="${"__next"}"><div class="${"z-0 flex flex-col items-center w-full pb-16 lg:pb-0"}">${validate_component(Bridgetab, "Bridgetab").$$render($$result, {}, {}, {})}</div></div></div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/web3-store-7eaac438.js
var chains, getGlobalObject, Web3, loadWeb3, getWindowEthereum, createStore, allStores, noData, getData, makeChainStore, connected, chainId, selectedAccount;
var init_web3_store_7eaac438 = __esm({
  ".svelte-kit/output/server/chunks/web3-store-7eaac438.js"() {
    init_shims();
    init_index_8f6e8620();
    chains = [
      {
        name: "Ethereum Mainnet",
        chain: "ETH",
        network: "mainnet",
        icon: "ethereum",
        rpc: [
          "https://mainnet.infura.io/v3/${INFURA_API_KEY}",
          "wss://mainnet.infura.io/ws/v3/${INFURA_API_KEY}",
          "https://api.mycryptoapi.com/eth",
          "https://cloudflare-eth.com"
        ],
        faucets: [],
        nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
        infoURL: "https://ethereum.org",
        shortName: "eth",
        chainId: 1,
        networkId: 1,
        slip44: 60,
        ens: { registry: "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e" },
        explorers: [
          {
            name: "etherscan",
            url: "https://etherscan.io",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Expanse Network",
        chain: "EXP",
        network: "mainnet",
        rpc: ["https://node.expanse.tech"],
        faucets: [],
        nativeCurrency: { name: "Expanse Network Ether", symbol: "EXP", decimals: 18 },
        infoURL: "https://expanse.tech",
        shortName: "exp",
        chainId: 2,
        networkId: 1,
        slip44: 40
      },
      {
        name: "Ethereum Testnet Ropsten",
        chain: "ETH",
        network: "ropsten",
        rpc: [
          "https://ropsten.infura.io/v3/${INFURA_API_KEY}",
          "wss://ropsten.infura.io/ws/v3/${INFURA_API_KEY}"
        ],
        faucets: ["https://faucet.ropsten.be?${ADDRESS}"],
        nativeCurrency: { name: "Ropsten Ether", symbol: "ROP", decimals: 18 },
        infoURL: "https://github.com/ethereum/ropsten",
        shortName: "rop",
        chainId: 3,
        networkId: 3,
        ens: { registry: "0x112234455c3a32fd11230c42e7bccd4a84e02010" }
      },
      {
        name: "Ethereum Testnet Rinkeby",
        chain: "ETH",
        network: "rinkeby",
        rpc: [
          "https://rinkeby.infura.io/v3/${INFURA_API_KEY}",
          "wss://rinkeby.infura.io/ws/v3/${INFURA_API_KEY}"
        ],
        faucets: ["https://faucet.rinkeby.io"],
        nativeCurrency: { name: "Rinkeby Ether", symbol: "RIN", decimals: 18 },
        infoURL: "https://www.rinkeby.io",
        shortName: "rin",
        chainId: 4,
        networkId: 4,
        ens: { registry: "0xe7410170f87102df0055eb195163a03b7f2bff4a" },
        explorers: [
          {
            name: "etherscan-rinkeby",
            url: "https://rinkeby.etherscan.io",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Ethereum Testnet G\xF6rli",
        chain: "ETH",
        network: "goerli",
        rpc: [
          "https://rpc.goerli.mudit.blog/",
          "https://rpc.slock.it/goerli ",
          "https://goerli.prylabs.net/"
        ],
        faucets: [
          "https://goerli-faucet.slock.it/?address=${ADDRESS}",
          "https://faucet.goerli.mudit.blog"
        ],
        nativeCurrency: { name: "G\xF6rli Ether", symbol: "GOR", decimals: 18 },
        infoURL: "https://goerli.net/#about",
        shortName: "gor",
        chainId: 5,
        networkId: 5,
        ens: { registry: "0x112234455c3a32fd11230c42e7bccd4a84e02010" }
      },
      {
        name: "Ethereum Classic Testnet Kotti",
        chain: "ETC",
        network: "kotti",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Kotti Ether", symbol: "KOT", decimals: 18 },
        infoURL: "https://explorer.jade.builders/?network=kotti",
        shortName: "kot",
        chainId: 6,
        networkId: 6
      },
      {
        name: "ThaiChain",
        chain: "TCH",
        network: "mainnet",
        rpc: ["https://rpc.dome.cloud"],
        faucets: [],
        nativeCurrency: { name: "ThaiChain Ether", symbol: "TCH", decimals: 18 },
        infoURL: "https://thaichain.io",
        shortName: "tch",
        chainId: 7,
        networkId: 7
      },
      {
        name: "Ubiq",
        chain: "UBQ",
        network: "mainnet",
        rpc: ["https://rpc.octano.dev", "https://pyrus2.ubiqscan.io"],
        faucets: [],
        nativeCurrency: { name: "Ubiq Ether", symbol: "UBQ", decimals: 18 },
        infoURL: "https://ubiqsmart.com",
        shortName: "ubq",
        chainId: 8,
        networkId: 8,
        slip44: 108,
        explorers: [
          {
            name: "ubiqscan",
            url: "https://ubiqscan.io",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Ubiq Network Testnet",
        chain: "UBQ",
        network: "mainnet",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Ubiq Testnet Ether", symbol: "TUBQ", decimals: 18 },
        infoURL: "https://ethersocial.org",
        shortName: "tubq",
        chainId: 9,
        networkId: 2
      },
      {
        name: "Optimistic Ethereum",
        chain: "ETH",
        network: "mainnet",
        rpc: ["https://mainnet.optimism.io/"],
        faucets: [],
        nativeCurrency: { name: "Ether", symbol: "OETH", decimals: 18 },
        infoURL: "https://optimism.io",
        shortName: "oeth",
        chainId: 10,
        networkId: 10
      },
      {
        name: "Metadium Mainnet",
        chain: "META",
        network: "mainnet",
        rpc: ["https://api.metadium.com/prod"],
        faucets: [],
        nativeCurrency: { name: "Metadium Mainnet Ether", symbol: "META", decimals: 18 },
        infoURL: "https://metadium.com",
        shortName: "meta",
        chainId: 11,
        networkId: 11,
        slip44: 916
      },
      {
        name: "Metadium Testnet",
        chain: "META",
        network: "testnet",
        rpc: ["https://api.metadium.com/dev"],
        faucets: [],
        nativeCurrency: { name: "Metadium Testnet Ether", symbol: "KAL", decimals: 18 },
        infoURL: "https://metadium.com",
        shortName: "kal",
        chainId: 12,
        networkId: 12
      },
      {
        name: "Diode Testnet Staging",
        chain: "DIODE",
        network: "testnet",
        rpc: [
          "https://staging.diode.io:8443/",
          "wss://staging.diode.io:8443/ws"
        ],
        faucets: [],
        nativeCurrency: { name: "Staging Diodes", symbol: "sDIODE", decimals: 18 },
        infoURL: "https://diode.io/staging",
        shortName: "dstg",
        chainId: 13,
        networkId: 13
      },
      {
        name: "Flare Mainnet",
        chain: "FLR",
        network: "flare",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Spark", symbol: "FLR", decimals: 18 },
        infoURL: "https://flare.xyz",
        shortName: "flr",
        chainId: 14,
        networkId: 14
      },
      {
        name: "Diode Prenet",
        chain: "DIODE",
        network: "mainnet",
        rpc: [
          "https://prenet.diode.io:8443/",
          "wss://prenet.diode.io:8443/ws"
        ],
        faucets: [],
        nativeCurrency: { name: "Diodes", symbol: "DIODE", decimals: 18 },
        infoURL: "https://diode.io/prenet",
        shortName: "diode",
        chainId: 15,
        networkId: 15
      },
      {
        name: "Flare Testnet Coston",
        chain: "FLR",
        network: "coston",
        rpc: [],
        faucets: ["https://faucet.towolabs.com"],
        nativeCurrency: { name: "Coston Spark", symbol: "CFLR", decimals: 18 },
        infoURL: "https://github.com/flare-eng/coston",
        shortName: "cflr",
        chainId: 16,
        networkId: 16
      },
      {
        name: "ThaiChain 2.0 ThaiFi",
        chain: "TCH",
        network: "thaifi",
        rpc: ["https://rpc.thaifi.com"],
        faucets: [],
        nativeCurrency: { name: "Thaifi Ether", symbol: "TFI", decimals: 18 },
        infoURL: "https://exp.thaifi.com",
        shortName: "tfi",
        chainId: 17,
        networkId: 17
      },
      {
        name: "ThunderCore Testnet",
        chain: "TST",
        network: "testnet",
        rpc: ["https://testnet-rpc.thundercore.com"],
        faucets: ["https://faucet-testnet.thundercore.com"],
        nativeCurrency: { name: "ThunderCore Testnet Ether", symbol: "TST", decimals: 18 },
        infoURL: "https://thundercore.com",
        shortName: "TST",
        chainId: 18,
        networkId: 18
      },
      {
        name: "Songbird Canary-Network",
        chain: "SGB",
        network: "songbird",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Songbird", symbol: "SGB", decimals: 18 },
        infoURL: "https://flare.xyz",
        shortName: "sgb",
        chainId: 19,
        networkId: 19
      },
      {
        name: "ELA-ETH-Sidechain Mainnet",
        chain: "ETH",
        network: "mainnet",
        rpc: ["https://mainrpc.elaeth.io"],
        faucets: [],
        nativeCurrency: { name: "Elastos", symbol: "ELA", decimals: 18 },
        infoURL: "https://www.elastos.org/",
        shortName: "elaeth",
        chainId: 20,
        networkId: 20
      },
      {
        name: "ELA-ETH-Sidechain Testnet",
        chain: "ETH",
        network: "testnet",
        rpc: ["https://rpc.elaeth.io"],
        faucets: ["https://faucet.elaeth.io/"],
        nativeCurrency: { name: "Elastos", symbol: "tELA", decimals: 18 },
        infoURL: "https://elaeth.io/",
        shortName: "elaetht",
        chainId: 21,
        networkId: 21
      },
      {
        name: "ELA-DID-Sidechain Mainnet",
        chain: "ETH",
        network: "mainnet",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Elastos", symbol: "ELA", decimals: 18 },
        infoURL: "https://www.elastos.org/",
        shortName: "eladid",
        chainId: 22,
        networkId: 22
      },
      {
        name: "ELA-DID-Sidechain Testnet",
        chain: "ETH",
        network: "testnet",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Elastos", symbol: "tELA", decimals: 18 },
        infoURL: "https://elaeth.io/",
        shortName: "eladidt",
        chainId: 23,
        networkId: 23
      },
      {
        name: "RSK Mainnet",
        chain: "RSK",
        network: "mainnet",
        rpc: ["https://public-node.rsk.co", "https://mycrypto.rsk.co"],
        faucets: [],
        nativeCurrency: { name: "RSK Mainnet Ether", symbol: "RBTC", decimals: 18 },
        infoURL: "https://rsk.co",
        shortName: "rsk",
        chainId: 30,
        networkId: 30,
        slip44: 137
      },
      {
        name: "RSK Testnet",
        chain: "RSK",
        network: "testnet",
        rpc: [
          "https://public-node.testnet.rsk.co",
          "https://mycrypto.testnet.rsk.co"
        ],
        faucets: ["https://faucet.testnet.rsk.co"],
        nativeCurrency: { name: "RSK Testnet Ether", symbol: "tRBTC", decimals: 18 },
        infoURL: "https://rsk.co",
        shortName: "trsk",
        chainId: 31,
        networkId: 31
      },
      {
        name: "GoodData Testnet",
        chain: "GooD",
        network: "testnet",
        rpc: ["https://test2.goodata.io"],
        faucets: [],
        nativeCurrency: { name: "GoodData Testnet Ether", symbol: "GooD", decimals: 18 },
        infoURL: "https://www.goodata.org",
        shortName: "GooDT",
        chainId: 32,
        networkId: 32
      },
      {
        name: "GoodData Mainnet",
        chain: "GooD",
        network: "mainnet",
        rpc: ["https://rpc.goodata.io"],
        faucets: [],
        nativeCurrency: { name: "GoodData Mainnet Ether", symbol: "GooD", decimals: 18 },
        infoURL: "https://www.goodata.org",
        shortName: "GooD",
        chainId: 33,
        networkId: 33
      },
      {
        name: "TBWG Chain",
        chain: "TBWG",
        network: "mainnet",
        rpc: ["https://rpc.tbwg.io"],
        faucets: [],
        nativeCurrency: { name: "TBWG Ether", symbol: "TBG", decimals: 18 },
        infoURL: "https://tbwg.io",
        shortName: "tbwg",
        chainId: 35,
        networkId: 35
      },
      {
        name: "Valorbit",
        chain: "VAL",
        network: "mainnet",
        rpc: ["https://rpc.valorbit.com/v2"],
        faucets: [],
        nativeCurrency: { name: "Valorbit", symbol: "VAL", decimals: 18 },
        infoURL: "https://valorbit.com",
        shortName: "val",
        chainId: 38,
        networkId: 38,
        slip44: 538
      },
      {
        name: "Telos EVM Mainnet",
        chain: "TLOS",
        network: "mainnet",
        rpc: ["https://mainnet.telos.net/evm"],
        faucets: [],
        nativeCurrency: { name: "Telos", symbol: "TLOS", decimals: 18 },
        infoURL: "https://telos.net",
        shortName: "Telos EVM",
        chainId: 40,
        networkId: 40
      },
      {
        name: "Telos EVM Testnet",
        chain: "TLOS",
        network: "testnet",
        rpc: ["https://testnet.telos.net/evm"],
        faucets: ["https://app.telos.net/testnet/developers"],
        nativeCurrency: { name: "Telos", symbol: "TLOS", decimals: 18 },
        infoURL: "https://telos.net",
        shortName: "Telos EVM Testnet",
        chainId: 41,
        networkId: 41
      },
      {
        name: "Ethereum Testnet Kovan",
        chain: "ETH",
        network: "kovan",
        rpc: [
          "https://kovan.poa.network",
          "http://kovan.poa.network:8545",
          "https://kovan.infura.io/v3/${INFURA_API_KEY}",
          "wss://kovan.infura.io/ws/v3/${INFURA_API_KEY}",
          "ws://kovan.poa.network:8546"
        ],
        faucets: [
          "https://faucet.kovan.network",
          "https://gitter.im/kovan-testnet/faucet"
        ],
        nativeCurrency: { name: "Kovan Ether", symbol: "KOV", decimals: 18 },
        infoURL: "https://kovan-testnet.github.io/website",
        shortName: "kov",
        chainId: 42,
        networkId: 42
      },
      {
        name: "Darwinia Pangolin Testnet",
        chain: "pangolin",
        network: "free testnet",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Pangolin RING", symbol: "PRING", decimals: 9 },
        infoURL: "https://darwinia.network/",
        shortName: "darwinia",
        chainId: 43,
        networkId: 43
      },
      {
        name: "Darwinia Crab Network",
        chain: "crab",
        network: "Crab network",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Crab Token", symbol: "CRING", decimals: 9 },
        infoURL: "https://crab.network/",
        shortName: "crab",
        chainId: 44,
        networkId: 44
      },
      {
        name: "XinFin Network Mainnet",
        chain: "XDC",
        network: "mainnet",
        rpc: ["https://rpc.xinfin.network"],
        faucets: [],
        nativeCurrency: { name: "XinFin", symbol: "XDC", decimals: 18 },
        infoURL: "https://xinfin.org",
        shortName: "xdc",
        chainId: 50,
        networkId: 50
      },
      {
        name: "XinFin Apothem Testnet",
        chain: "TXDC",
        network: "testnet",
        rpc: ["https://rpc.apothem.network"],
        faucets: [],
        nativeCurrency: { name: "XinFinTest", symbol: "TXDC", decimals: 18 },
        infoURL: "https://xinfin.org",
        shortName: "TXDC",
        chainId: 51,
        networkId: 51
      },
      {
        name: "CoinEx Smart Chain Mainnet",
        chain: "CSC",
        network: "mainnet",
        rpc: ["https://rpc-mainnet.coinex.net"],
        faucets: [],
        nativeCurrency: { name: "CoinEx Chain Native Token", symbol: "cet", decimals: 18 },
        infoURL: "http://www.coinex.org/",
        shortName: "cet",
        chainId: 52,
        networkId: 52
      },
      {
        name: "CoinEx Smart Chain Testnet",
        chain: "CSC",
        network: "testnet",
        rpc: ["https://rpc-testnet.coinex.net"],
        faucets: [],
        nativeCurrency: {
          name: "CoinEx Chain Test Native Token",
          symbol: "cett",
          decimals: 18
        },
        infoURL: "http://www.coinex.org/",
        shortName: "tcet",
        chainId: 53,
        networkId: 53
      },
      {
        name: "Binance Smart Chain Mainnet",
        chain: "BSC",
        network: "mainnet",
        rpc: [
          "https://bsc-dataseed1.binance.org",
          "https://bsc-dataseed2.binance.org",
          "https://bsc-dataseed3.binance.org",
          "https://bsc-dataseed4.binance.org",
          "https://bsc-dataseed1.defibit.io",
          "https://bsc-dataseed2.defibit.io",
          "https://bsc-dataseed3.defibit.io",
          "https://bsc-dataseed4.defibit.io",
          "https://bsc-dataseed1.ninicoin.io",
          "https://bsc-dataseed2.ninicoin.io",
          "https://bsc-dataseed3.ninicoin.io",
          "https://bsc-dataseed4.ninicoin.io",
          "wss://bsc-ws-node.nariox.org"
        ],
        faucets: [],
        nativeCurrency: { name: "Binance Chain Native Token", symbol: "BNB", decimals: 18 },
        infoURL: "https://www.binance.org",
        shortName: "bnb",
        chainId: 56,
        networkId: 56,
        explorers: [
          {
            name: "bscscan",
            url: "https://bscscan.com",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Syscoin Mainnet",
        chain: "SYS",
        network: "mainnet",
        rpc: ["https://rpc.syscoin.org", "wss://rpc.syscoin.org/wss"],
        faucets: ["https://faucet.syscoin.org"],
        nativeCurrency: { name: "Syscoin", symbol: "SYS", decimals: 18 },
        infoURL: "https://www.syscoin.org",
        shortName: "sys",
        chainId: 57,
        networkId: 57
      },
      {
        name: "Ontology Mainnet",
        chain: "Ontology",
        network: "mainnet",
        rpc: [
          "https://dappnode1.ont.io:20339",
          "https://dappnode2.ont.io:20339",
          "https://dappnode3.ont.io:20339",
          "https://dappnode4.ont.io:20339"
        ],
        faucets: [],
        nativeCurrency: { name: "ONG", symbol: "ONG", decimals: 9 },
        infoURL: "https://ont.io/",
        shortName: "Ontology Mainnet",
        chainId: 58,
        networkId: 58,
        explorers: [
          {
            name: "explorer",
            url: "https://explorer.ont.io/",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "EOS Mainnet",
        chain: "EOS",
        network: "mainnet",
        rpc: ["https://api.eosargentina.io"],
        faucets: [],
        nativeCurrency: { name: "EOS", symbol: "EOS", decimals: 18 },
        infoURL: "https://eoscommunity.org/",
        shortName: "EOS Mainnet",
        chainId: 59,
        networkId: 59,
        explorers: [
          {
            name: "bloks",
            url: "https://bloks.eosargentina.io",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "GoChain",
        chain: "GO",
        network: "mainnet",
        rpc: ["https://rpc.gochain.io"],
        faucets: [],
        nativeCurrency: { name: "GoChain Ether", symbol: "GO", decimals: 18 },
        infoURL: "https://gochain.io",
        shortName: "go",
        chainId: 60,
        networkId: 60,
        slip44: 6060,
        explorers: [
          {
            name: "GoChain Explorer",
            url: "https://explorer.gochain.io",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Ethereum Classic Mainnet",
        chain: "ETC",
        network: "mainnet",
        rpc: ["https://ethereumclassic.network"],
        faucets: [],
        nativeCurrency: { name: "Ethereum Classic Ether", symbol: "ETC", decimals: 18 },
        infoURL: "https://ethereumclassic.org",
        shortName: "etc",
        chainId: 61,
        networkId: 1,
        slip44: 61
      },
      {
        name: "Ethereum Classic Testnet Morden",
        chain: "ETC",
        network: "testnet",
        rpc: [],
        faucets: [],
        nativeCurrency: {
          name: "Ethereum Classic Testnet Ether",
          symbol: "TETC",
          decimals: 18
        },
        infoURL: "https://ethereumclassic.org",
        shortName: "tetc",
        chainId: 62,
        networkId: 2
      },
      {
        name: "Ethereum Classic Testnet Mordor",
        chain: "ETC",
        network: "testnet",
        rpc: [],
        faucets: [],
        nativeCurrency: {
          name: "Mordor Classic Testnet Ether",
          symbol: "METC",
          decimals: 18
        },
        infoURL: "https://github.com/eth-classic/mordor/",
        shortName: "metc",
        chainId: 63,
        networkId: 7
      },
      {
        name: "Ellaism",
        chain: "ELLA",
        network: "mainnet",
        rpc: ["https://jsonrpc.ellaism.org"],
        faucets: [],
        nativeCurrency: { name: "Ellaism Ether", symbol: "ELLA", decimals: 18 },
        infoURL: "https://ellaism.org",
        shortName: "ella",
        chainId: 64,
        networkId: 64,
        slip44: 163
      },
      {
        name: "OKExChain Testnet",
        chain: "okexchain",
        network: "testnet",
        rpc: ["https://exchaintestrpc.okex.org"],
        faucets: ["https://www.okex.com/drawdex"],
        nativeCurrency: {
          name: "OKExChain Global Utility Token in testnet",
          symbol: "OKT",
          decimals: 18
        },
        infoURL: "https://www.okex.com/okexchain",
        shortName: "tokt",
        chainId: 65,
        networkId: 65,
        explorers: [
          {
            name: "OKLink",
            url: "https://www.oklink.com/okexchain-test",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "OKExChain Mainnet",
        chain: "okexchain",
        network: "mainnet",
        rpc: ["https://exchainrpc.okex.org"],
        faucets: [],
        nativeCurrency: {
          name: "OKExChain Global Utility Token",
          symbol: "OKT",
          decimals: 18
        },
        infoURL: "https://www.okex.com/okexchain",
        shortName: "okt",
        chainId: 66,
        networkId: 66,
        explorers: [
          {
            name: "OKLink",
            url: "https://www.oklink.com/okexchain",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "DBChain Testnet",
        chain: "DBM",
        network: "testnet",
        rpc: ["http://test-rpc.dbmbp.com"],
        faucets: [],
        nativeCurrency: { name: "DBChain Testnet", symbol: "DBM", decimals: 18 },
        infoURL: "http://test.dbmbp.com",
        shortName: "dbm",
        chainId: 67,
        networkId: 67
      },
      {
        name: "SoterOne Mainnet",
        chain: "SOTER",
        network: "mainnet",
        rpc: ["https://rpc.soter.one"],
        faucets: [],
        nativeCurrency: { name: "SoterOne Mainnet Ether", symbol: "SOTER", decimals: 18 },
        infoURL: "https://www.soterone.com",
        shortName: "SO1",
        chainId: 68,
        networkId: 68
      },
      {
        name: "Optimistic Ethereum Testnet Kovan",
        chain: "ETH",
        network: "kovan",
        rpc: ["https://kovan.optimism.io/"],
        faucets: [],
        nativeCurrency: { name: "Kovan Ether", symbol: "KOR", decimals: 18 },
        infoURL: "https://optimism.io",
        shortName: "okov",
        chainId: 69,
        networkId: 69
      },
      {
        name: "Mix",
        chain: "MIX",
        network: "mainnet",
        rpc: ["https://rpc2.mix-blockchain.org:8647"],
        faucets: [],
        nativeCurrency: { name: "Mix Ether", symbol: "MIX", decimals: 18 },
        infoURL: "https://mix-blockchain.org",
        shortName: "mix",
        chainId: 76,
        networkId: 76,
        slip44: 76
      },
      {
        name: "POA Network Sokol",
        chain: "POA",
        network: "sokol",
        rpc: [
          "https://sokol.poa.network",
          "wss://sokol.poa.network/wss",
          "ws://sokol.poa.network:8546"
        ],
        faucets: ["https://faucet-sokol.herokuapp.com"],
        nativeCurrency: { name: "POA Sokol Ether", symbol: "POA", decimals: 18 },
        infoURL: "https://poa.network",
        shortName: "poa",
        chainId: 77,
        networkId: 77
      },
      {
        name: "PrimusChain mainnet",
        chain: "PC",
        network: "mainnet",
        rpc: ["https://ethnode.primusmoney.com/mainnet"],
        faucets: [],
        nativeCurrency: { name: "Primus Ether", symbol: "PETH", decimals: 18 },
        infoURL: "https://primusmoney.com",
        shortName: "primuschain",
        chainId: 78,
        networkId: 78
      },
      {
        name: "GeneChain",
        chain: "GeneChain",
        network: "mainnet",
        rpc: ["https://rpc.genechain.io"],
        faucets: [],
        nativeCurrency: { name: "RNA", symbol: "RNA", decimals: 18 },
        infoURL: "https://scan.genechain.io/",
        shortName: "GeneChain",
        chainId: 80,
        networkId: 80,
        explorers: [
          {
            name: "GeneChain Scan",
            url: "https://scan.genechain.io",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Meter Mainnet",
        chain: "METER",
        network: "mainnet",
        rpc: ["https://rpc.meter.io"],
        faucets: [],
        nativeCurrency: { name: "Meter", symbol: "MTR", decimals: 18 },
        infoURL: "https://www.meter.io",
        shortName: "Meter",
        chainId: 82,
        networkId: 82
      },
      {
        name: "GateChain Testnet",
        chainId: 85,
        shortName: "gttest",
        chain: "GTTEST",
        network: "testnet",
        networkId: 85,
        nativeCurrency: { name: "GateToken", symbol: "GT", decimals: 18 },
        rpc: ["https://testnet.gatenode.cc"],
        faucets: ["https://www.gatescan.org/testnet/faucet"],
        explorers: [
          {
            name: "GateScan",
            url: "https://www.gatescan.org/testnet",
            standard: "EIP3091"
          }
        ],
        infoURL: "https://www.gatechain.io"
      },
      {
        name: "GateChain Mainnet",
        chainId: 86,
        shortName: "gt",
        chain: "GT",
        network: "mainnet",
        networkId: 86,
        nativeCurrency: { name: "GateToken", symbol: "GT", decimals: 18 },
        rpc: ["https://evm.gatenode.cc"],
        faucets: ["https://www.gatescan.org/faucet"],
        explorers: [
          {
            name: "GateScan",
            url: "https://www.gatescan.org",
            standard: "EIP3091"
          }
        ],
        infoURL: "https://www.gatechain.io"
      },
      {
        name: "TomoChain",
        chain: "TOMO",
        network: "mainnet",
        rpc: ["https://rpc.tomochain.com"],
        faucets: [],
        nativeCurrency: { name: "TomoChain Ether", symbol: "TOMO", decimals: 18 },
        infoURL: "https://tomocoin.io",
        shortName: "tomo",
        chainId: 88,
        networkId: 88
      },
      {
        name: "CryptoKylin Testnet",
        chain: "EOS",
        network: "testnet",
        rpc: ["https://kylin.eosargentina.io"],
        faucets: [],
        nativeCurrency: { name: "EOS", symbol: "EOS", decimals: 18 },
        infoURL: "https://www.cryptokylin.io/",
        shortName: "Kylin Testnet",
        chainId: 95,
        networkId: 95,
        explorers: [
          {
            name: "eosq",
            url: "https://kylin.eosargentina.io",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Binance Smart Chain Testnet",
        chain: "BSC",
        network: "Chapel",
        rpc: [
          "https://data-seed-prebsc-1-s1.binance.org:8545",
          "https://data-seed-prebsc-2-s1.binance.org:8545",
          "https://data-seed-prebsc-1-s2.binance.org:8545",
          "https://data-seed-prebsc-2-s2.binance.org:8545",
          "https://data-seed-prebsc-1-s3.binance.org:8545",
          "https://data-seed-prebsc-2-s3.binance.org:8545"
        ],
        faucets: ["https://testnet.binance.org/faucet-smart"],
        nativeCurrency: {
          name: "Binance Chain Native Token",
          symbol: "tBNB",
          decimals: 18
        },
        infoURL: "https://testnet.binance.org/",
        shortName: "bnbt",
        chainId: 97,
        networkId: 97,
        explorers: [
          {
            name: "bscscan-testnet",
            url: "https://testnet.bscscan.com",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "POA Network Core",
        chain: "POA",
        network: "core",
        rpc: [
          "https://core.poanetwork.dev",
          "http://core.poanetwork.dev:8545",
          "https://core.poa.network",
          "ws://core.poanetwork.dev:8546"
        ],
        faucets: [],
        nativeCurrency: { name: "POA Network Core Ether", symbol: "SKL", decimals: 18 },
        infoURL: "https://poa.network",
        shortName: "skl",
        chainId: 99,
        networkId: 99
      },
      {
        name: "xDAI Chain",
        chain: "XDAI",
        network: "mainnet",
        rpc: [
          "https://rpc.xdaichain.com",
          "https://xdai.poanetwork.dev",
          "wss://rpc.xdaichain.com/wss",
          "wss://xdai.poanetwork.dev/wss",
          "http://xdai.poanetwork.dev",
          "https://dai.poa.network",
          "ws://xdai.poanetwork.dev:8546"
        ],
        faucets: [],
        nativeCurrency: { name: "xDAI", symbol: "xDAI", decimals: 18 },
        infoURL: "https://forum.poa.network/c/xdai-chain",
        shortName: "xdai",
        chainId: 100,
        networkId: 100,
        slip44: 700
      },
      {
        name: "EtherInc",
        chain: "ETI",
        network: "mainnet",
        rpc: ["https://api.einc.io/jsonrpc/mainnet"],
        faucets: [],
        nativeCurrency: { name: "EtherInc Ether", symbol: "ETI", decimals: 18 },
        infoURL: "https://einc.io",
        shortName: "eti",
        chainId: 101,
        networkId: 1,
        slip44: 464
      },
      {
        name: "Web3Games Testnet",
        chain: "Web3Games",
        network: "testnet",
        rpc: ["https://substrate.org.cn"],
        faucets: [],
        nativeCurrency: { name: "Web3Games", symbol: "W3G", decimals: 18 },
        infoURL: "https://web3games.org/",
        shortName: "w3g",
        chainId: 102,
        networkId: 102
      },
      {
        name: "ThunderCore Mainnet",
        chain: "TT",
        network: "mainnet",
        rpc: ["https://mainnet-rpc.thundercore.com"],
        faucets: ["https://faucet.thundercore.com"],
        nativeCurrency: { name: "ThunderCore Mainnet Ether", symbol: "TT", decimals: 18 },
        infoURL: "https://thundercore.com",
        shortName: "TT",
        chainId: 108,
        networkId: 108
      },
      {
        name: "Proton Testnet",
        chain: "XPR",
        network: "testnet",
        rpc: ["https://protontestnet.greymass.com/"],
        faucets: [],
        nativeCurrency: { name: "Proton", symbol: "XPR", decimals: 4 },
        infoURL: "https://protonchain.com",
        shortName: "xpr",
        chainId: 110,
        networkId: 110
      },
      {
        name: "EtherLite Chain",
        chain: "ETL",
        network: "mainnet",
        rpc: ["https://rpc.etherlite.org"],
        faucets: ["https://etherlite.org/faucets"],
        nativeCurrency: { name: "EtherLite", symbol: "ETL", decimals: 18 },
        infoURL: "https://etherlite.org",
        shortName: "ETL",
        chainId: 111,
        networkId: 111,
        icon: "etherlite"
      },
      {
        name: "Fuse Mainnet",
        chain: "FUSE",
        network: "mainnet",
        rpc: ["https://rpc.fuse.io"],
        faucets: [],
        nativeCurrency: { name: "Fuse", symbol: "FUSE", decimals: 18 },
        infoURL: "https://fuse.io/",
        shortName: "fuse",
        chainId: 122,
        networkId: 122
      },
      {
        name: "Decentralized Web Mainnet",
        shortName: "dwu",
        chain: "DWU",
        network: "mainnet",
        chainId: 124,
        networkId: 124,
        rpc: ["https://decentralized-web.tech/dw_rpc.php"],
        faucets: [],
        infoURL: "https://decentralized-web.tech/dw_chain.php",
        nativeCurrency: { name: "Decentralized Web Utility", symbol: "DWU", decimals: 18 }
      },
      {
        name: "Factory 127 Mainnet",
        chain: "FETH",
        network: "factory127 mainnet",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Factory 127 Token", symbol: "FETH", decimals: 18 },
        infoURL: "https://www.factory127.com",
        shortName: "feth",
        chainId: 127,
        networkId: 127,
        slip44: 127
      },
      {
        name: "Huobi ECO Chain Mainnet",
        chain: "Heco",
        network: "mainnet",
        rpc: [
          "https://http-mainnet.hecochain.com",
          "wss://ws-mainnet.hecochain.com"
        ],
        faucets: [],
        nativeCurrency: {
          name: "Huobi ECO Chain Native Token",
          symbol: "HT",
          decimals: 18
        },
        infoURL: "https://www.hecochain.com",
        shortName: "heco",
        chainId: 128,
        networkId: 128,
        explorers: [
          {
            name: "hecoinfo",
            url: "https://hecoinfo.com",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Matic(Polygon) Mainnet",
        chain: "Matic(Polygon)",
        network: "mainnet",
        rpc: [
          "https://rpc-mainnet.matic.network",
          "wss://ws-mainnet.matic.network",
          "https://rpc-mainnet.matic.quiknode.pro",
          "https://matic-mainnet.chainstacklabs.com"
        ],
        faucets: [],
        nativeCurrency: { name: "Matic", symbol: "MATIC", decimals: 18 },
        infoURL: "https://matic.network/",
        shortName: "matic",
        chainId: 137,
        networkId: 137,
        explorers: [
          {
            name: "polygonscan",
            url: "https://polygonscan.com",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "DAX CHAIN",
        chain: "DAX",
        network: "mainnet",
        rpc: ["https://rpc.prodax.io"],
        faucets: [],
        nativeCurrency: { name: "Prodax", symbol: "DAX", decimals: 18 },
        infoURL: "https://prodax.io/",
        shortName: "dax",
        chainId: 142,
        networkId: 142
      },
      {
        name: "Lightstreams Testnet",
        chain: "PHT",
        network: "sirius",
        rpc: ["https://node.sirius.lightstreams.io"],
        faucets: ["https://discuss.lightstreams.network/t/request-test-tokens"],
        nativeCurrency: { name: "Lightstreams PHT", symbol: "PHT", decimals: 18 },
        infoURL: "https://explorer.sirius.lightstreams.io",
        shortName: "tpht",
        chainId: 162,
        networkId: 162
      },
      {
        name: "Lightstreams Mainnet",
        chain: "PHT",
        network: "mainnet",
        rpc: ["https://node.mainnet.lightstreams.io"],
        faucets: [],
        nativeCurrency: { name: "Lightstreams PHT", symbol: "PHT", decimals: 18 },
        infoURL: "https://explorer.lightstreams.io",
        shortName: "pht",
        chainId: 163,
        networkId: 163
      },
      {
        name: "HOO Smart Chain Testnet",
        chain: "ETH",
        network: "testnet",
        rpc: ["https://http-testnet.hoosmartchain.com"],
        faucets: ["https://faucet-testnet.hscscan.com/"],
        nativeCurrency: { name: "HOO", symbol: "HOO", decimals: 18 },
        infoURL: "https://www.hoosmartchain.com",
        shortName: "hoosmartchain",
        chainId: 170,
        networkId: 170
      },
      {
        name: "Latam-Blockchain Resil Testnet",
        chain: "Resil",
        network: "testnet",
        rpc: [
          "https://rpc.latam-blockchain.com",
          "wss://ws.latam-blockchain.com"
        ],
        faucets: ["https://faucet.latam-blockchain.com"],
        nativeCurrency: {
          name: "Latam-Blockchain Resil Test Native Token",
          symbol: "usd",
          decimals: 18
        },
        infoURL: "https://latam-blockchain.com",
        shortName: "resil",
        chainId: 172,
        networkId: 172
      },
      {
        name: "Arbitrum on xDai",
        chain: "AOX",
        network: "xdai",
        rpc: ["https://arbitrum.xdaichain.com/"],
        faucets: [],
        nativeCurrency: { name: "xDAI", symbol: "xDAI", decimals: 18 },
        infoURL: "https://xdaichain.com",
        shortName: "aox",
        chainId: 200,
        networkId: 200,
        explorers: [
          {
            name: "blockscout",
            url: "https://blockscout.com/xdai/arbitrum",
            standard: "EIP3091"
          }
        ],
        parent: { chain: "eip155-100", type: "L2" }
      },
      {
        name: "Freight Trust Network",
        chain: "EDI",
        network: "freight & trade network",
        rpc: [
          "http://13.57.207.168:3435",
          "https://app.freighttrust.net/ftn/${API_KEY}"
        ],
        faucets: ["http://faucet.freight.sh"],
        nativeCurrency: { name: "Freight Trust Native", symbol: "0xF", decimals: 18 },
        infoURL: "https://freighttrust.com",
        shortName: "EDI",
        chainId: 211,
        networkId: 0
      },
      {
        name: "Energy Web Chain",
        chain: "Energy Web Chain",
        network: "mainnet",
        rpc: ["https://rpc.energyweb.org", "wss://rpc.energyweb.org/ws"],
        faucets: ["https://faucet.carbonswap.exchange"],
        nativeCurrency: { name: "Energy Web Token", symbol: "EWT", decimals: 18 },
        infoURL: "https://energyweb.org",
        shortName: "ewt",
        chainId: 246,
        networkId: 246,
        slip44: 246
      },
      {
        name: "Fantom Opera",
        chain: "FTM",
        network: "mainnet",
        rpc: ["https://rpc.ftm.tools"],
        faucets: [],
        nativeCurrency: { name: "Fantom", symbol: "FTM", decimals: 18 },
        infoURL: "https://fantom.foundation",
        shortName: "ftm",
        chainId: 250,
        networkId: 250,
        icon: "fantom",
        explorers: [
          {
            name: "ftmscan",
            url: "https://ftmscan.com",
            icon: "ftmscan",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Huobi ECO Chain Testnet",
        chain: "Heco",
        network: "testnet",
        rpc: [
          "https://http-testnet.hecochain.com",
          "wss://ws-testnet.hecochain.com"
        ],
        faucets: ["https://scan-testnet.hecochain.com/faucet"],
        nativeCurrency: {
          name: "Huobi ECO Chain Test Native Token",
          symbol: "htt",
          decimals: 18
        },
        infoURL: "https://testnet.hecoinfo.com",
        shortName: "hecot",
        chainId: 256,
        networkId: 256
      },
      {
        name: "High Performance Blockchain",
        chain: "HPB",
        network: "mainnet",
        rpc: ["https://hpbnode.com", "wss://ws.hpbnode.com"],
        faucets: ["https://myhpbwallet.com/"],
        nativeCurrency: {
          name: "High Performance Blockchain Ether",
          symbol: "HPB",
          decimals: 18
        },
        infoURL: "https://hpb.io",
        shortName: "hpb",
        chainId: 269,
        networkId: 269,
        slip44: 269,
        explorers: [
          {
            name: "hpbscan",
            url: "https://hpbscan.org/",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "KCC Mainnet",
        chain: "KCC",
        network: "mainnet",
        rpc: [
          "https://rpc-mainnet.kcc.network",
          "wss://rpc-ws-mainnet.kcc.network"
        ],
        faucets: [],
        nativeCurrency: { name: "KuCoin Token", symbol: "KCS", decimals: 18 },
        infoURL: "https://kcc.io",
        shortName: "kcs",
        chainId: 321,
        networkId: 1,
        explorers: [
          {
            name: "KCC Explorer",
            url: "https://explorer.kcc.io/en",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "KCC Testnet",
        chain: "KCC",
        network: "testnet",
        rpc: [
          "https://rpc-testnet.kcc.network",
          "wss://rpc-ws-testnet.kcc.network"
        ],
        faucets: ["https://faucet-testnet.kcc.network"],
        nativeCurrency: { name: "KuCoin Testnet Token", symbol: "tKCS", decimals: 18 },
        infoURL: "https://scan-testnet.kcc.network",
        shortName: "kcst",
        chainId: 322,
        networkId: 322,
        explorers: [
          {
            name: "kcc-scan",
            url: "https://scan-testnet.kcc.network",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Theta Mainnet",
        chain: "Theta",
        network: "mainnet",
        rpc: ["https://eth-rpc-api.thetatoken.org/rpc"],
        faucets: [],
        nativeCurrency: { name: "Theta Fuel", symbol: "TFUEL", decimals: 18 },
        infoURL: "https://www.thetatoken.org/",
        shortName: "theta-mainnet",
        chainId: 361,
        networkId: 361,
        explorers: [
          {
            name: "Theta Mainnet Explorer",
            url: "https://explorer.thetatoken.org",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Theta Sapphire Testnet",
        chain: "Theta",
        network: "testnet_sapphire",
        rpc: ["https://eth-rpc-api-sapphire.thetatoken.org/rpc"],
        faucets: [],
        nativeCurrency: { name: "Theta Fuel", symbol: "TFUEL", decimals: 18 },
        infoURL: "https://www.thetatoken.org/",
        shortName: "theta-sapphire",
        chainId: 363,
        networkId: 363,
        explorers: [
          {
            name: "Theta Sapphire Testnet Explorer",
            url: "https://guardian-testnet-sapphire-explorer.thetatoken.org",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Theta Amber Testnet",
        chain: "Theta",
        network: "testnet_amber",
        rpc: ["https://eth-rpc-api-amber.thetatoken.org/rpc"],
        faucets: [],
        nativeCurrency: { name: "Theta Fuel", symbol: "TFUEL", decimals: 18 },
        infoURL: "https://www.thetatoken.org/",
        shortName: "theta-amber",
        chainId: 364,
        networkId: 364,
        explorers: [
          {
            name: "Theta Amber Testnet Explorer",
            url: "https://guardian-testnet-amber-explorer.thetatoken.org",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Theta Testnet",
        chain: "Theta",
        network: "testnet",
        rpc: ["https://eth-rpc-api-testnet.thetatoken.org/rpc"],
        faucets: [],
        nativeCurrency: { name: "Theta Fuel", symbol: "TFUEL", decimals: 18 },
        infoURL: "https://www.thetatoken.org/",
        shortName: "theta-testnet",
        chainId: 365,
        networkId: 365,
        explorers: [
          {
            name: "Theta Testnet Explorer",
            url: "https://testnet-explorer.thetatoken.org",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "PulseChain Mainnet",
        shortName: "pls",
        chain: "PLS",
        network: "mainnet",
        chainId: 369,
        networkId: 369,
        infoURL: "https://pulsechain.com/",
        rpc: [
          "https://rpc.mainnet.pulsechain.com/v1/${PULSECHAIN_API_KEY}",
          "wss://rpc.mainnet.pulsechain.com/ws/v1/${PULSECHAIN_API_KEY}"
        ],
        faucets: [],
        nativeCurrency: { name: "Pulse", symbol: "PLS", decimals: 18 }
      },
      {
        name: "Lisinski",
        chain: "CRO",
        network: "mainnet",
        rpc: ["https://rpc-bitfalls1.lisinski.online"],
        faucets: ["https://pipa.lisinski.online"],
        nativeCurrency: { name: "Lisinski Ether", symbol: "LISINSKI", decimals: 18 },
        infoURL: "https://lisinski.online",
        shortName: "lisinski",
        chainId: 385,
        networkId: 385
      },
      {
        name: "Optimistic Ethereum Testnet Goerli",
        chain: "ETH",
        network: "goerli",
        rpc: ["https://goerli.optimism.io/"],
        faucets: [],
        nativeCurrency: { name: "G\xF6rli Ether", symbol: "GOR", decimals: 18 },
        infoURL: "https://optimism.io",
        shortName: "ogor",
        chainId: 420,
        networkId: 420
      },
      {
        name: "Rupaya",
        chain: "RUPX",
        network: "mainnet",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Rupaya", symbol: "RUPX", decimals: 18 },
        infoURL: "https://www.rupx.io",
        shortName: "rupx",
        chainId: 499,
        networkId: 499,
        slip44: 499
      },
      {
        name: "Tao Network",
        chain: "TAO",
        network: "core",
        rpc: [
          "https://rpc.testnet.tao.network",
          "http://rpc.testnet.tao.network:8545",
          "https://rpc.tao.network",
          "wss://rpc.tao.network"
        ],
        faucets: [],
        nativeCurrency: { name: "Tao", symbol: "TAO", decimals: 18 },
        infoURL: "https://tao.network",
        shortName: "tao",
        chainId: 558,
        networkId: 558
      },
      {
        name: "Acala Mandala Testnet",
        chain: "mACA",
        network: "testnet",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Acala Mandala Token", symbol: "mACA", decimals: 18 },
        infoURL: "https://acala.network",
        shortName: "maca",
        chainId: 595,
        networkId: 595
      },
      {
        name: "Karura Network",
        chain: "KAR",
        network: "mainnet",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Karura Token", symbol: "KAR", decimals: 18 },
        infoURL: "https://karura.network",
        shortName: "kar",
        chainId: 686,
        networkId: 686,
        slip44: 686
      },
      {
        name: "Factory 127 Testnet",
        chain: "FETH",
        network: "factory127 testnet",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Factory 127 Token", symbol: "FETH", decimals: 18 },
        infoURL: "https://www.factory127.com",
        shortName: "tfeth",
        chainId: 721,
        networkId: 721,
        slip44: 721
      },
      {
        name: "cheapETH",
        chain: "cheapETH",
        network: "cheapnet",
        rpc: ["https://node.cheapeth.org/rpc"],
        faucets: [],
        nativeCurrency: { name: "cTH", symbol: "cTH", decimals: 18 },
        infoURL: "https://cheapeth.org/",
        shortName: "cth",
        chainId: 777,
        networkId: 777
      },
      {
        name: "Acala Network",
        chain: "ACA",
        network: "mainnet",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Acala Token", symbol: "ACA", decimals: 18 },
        infoURL: "https://acala.network",
        shortName: "aca",
        chainId: 787,
        networkId: 787,
        slip44: 787
      },
      {
        name: "Haic",
        chain: "Haic",
        network: "mainnet",
        rpc: ["https://orig.haichain.io/"],
        faucets: [],
        nativeCurrency: { name: "Haicoin", symbol: "HAIC", decimals: 18 },
        infoURL: "https://www.haichain.io/",
        shortName: "haic",
        chainId: 803,
        networkId: 803
      },
      {
        name: "Callisto Mainnet",
        chain: "CLO",
        network: "mainnet",
        rpc: ["https://clo-geth.0xinfra.com"],
        faucets: [],
        nativeCurrency: { name: "Callisto Mainnet Ether", symbol: "CLO", decimals: 18 },
        infoURL: "https://callisto.network",
        shortName: "clo",
        chainId: 820,
        networkId: 1,
        slip44: 820
      },
      {
        name: "Callisto Testnet",
        chain: "CLO",
        network: "testnet",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Callisto Testnet Ether", symbol: "TCLO", decimals: 18 },
        infoURL: "https://callisto.network",
        shortName: "tclo",
        chainId: 821,
        networkId: 2
      },
      {
        name: "Wanchain",
        chain: "WAN",
        network: "mainnet",
        rpc: ["https://gwan-ssl.wandevs.org:56891/"],
        faucets: [],
        nativeCurrency: { name: "Wancoin", symbol: "WAN", decimals: 18 },
        infoURL: "https://www.wanscan.org",
        shortName: "wan",
        chainId: 888,
        networkId: 888,
        slip44: 5718350
      },
      {
        name: "PulseChain Testnet",
        shortName: "tpls",
        chain: "tPLS",
        network: "testnet",
        chainId: 940,
        networkId: 940,
        infoURL: "https://pulsechain.com/",
        rpc: [
          "https://rpc.testnet.pulsechain.com/v1/${PULSECHAIN_API_KEY}",
          "wss://rpc.testnet.pulsechain.com/ws/v1/${PULSECHAIN_API_KEY}"
        ],
        faucets: [],
        nativeCurrency: { name: "Test Pulse", symbol: "tPLS", decimals: 18 }
      },
      {
        name: "Nepal Blockchain Network",
        chain: "YETI",
        network: "mainnet",
        rpc: [
          "https://api.nepalblockchain.dev",
          "https://api.nepalblockchain.network"
        ],
        faucets: ["https://faucet.nepalblockchain.network"],
        nativeCurrency: {
          name: "Nepal Blockchain Network Ether",
          symbol: "YETI",
          decimals: 18
        },
        infoURL: "https://nepalblockchain.network",
        shortName: "yeti",
        chainId: 977,
        networkId: 977
      },
      {
        name: "Wanchain Testnet",
        chain: "WAN",
        network: "testnet",
        rpc: ["https://gwan-ssl.wandevs.org:46891/"],
        faucets: [],
        nativeCurrency: { name: "Wancoin", symbol: "WAN", decimals: 18 },
        infoURL: "https://testnet.wanscan.org",
        shortName: "twan",
        chainId: 999,
        networkId: 999
      },
      {
        name: "Klaytn Testnet Baobab",
        chain: "KLAY",
        network: "baobab",
        rpc: ["https://node-api.klaytnapi.com/v1/klaytn"],
        faucets: ["https://baobab.wallet.klaytn.com/access?next=faucet"],
        nativeCurrency: { name: "KLAY", symbol: "KLAY", decimals: 18 },
        infoURL: "https://www.klaytn.com/",
        shortName: "Baobab",
        chainId: 1001,
        networkId: 1001
      },
      {
        name: "Newton Testnet",
        chain: "NEW",
        network: "testnet",
        rpc: ["https://rpc1.newchain.newtonproject.org"],
        faucets: [],
        nativeCurrency: { name: "Newton", symbol: "NEW", decimals: 18 },
        infoURL: "https://www.newtonproject.org/",
        shortName: "tnew",
        chainId: 1007,
        networkId: 1007
      },
      {
        name: "Evrice Network",
        chain: "EVC",
        network: "Evrice",
        rpc: ["https://meta.evrice.com"],
        faucets: [],
        nativeCurrency: { name: "Evrice", symbol: "EVC", decimals: 18 },
        infoURL: "https://evrice.com",
        shortName: "EVC",
        chainId: 1010,
        networkId: 1010
      },
      {
        name: "Newton",
        chain: "NEW",
        network: "mainnet",
        rpc: ["https://global.rpc.mainnet.newtonproject.org"],
        faucets: [],
        nativeCurrency: { name: "Newton", symbol: "NEW", decimals: 18 },
        infoURL: "https://www.newtonproject.org/",
        shortName: "new",
        chainId: 1012,
        networkId: 1012
      },
      {
        name: "Sakura",
        chain: "Sakura",
        network: "sakura",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Sakura", symbol: "SKU", decimals: 18 },
        infoURL: "https://clover.finance/sakura",
        shortName: "sku",
        chainId: 1022,
        networkId: 1022
      },
      {
        name: "Clover Testnet",
        chain: "Clover",
        network: "clover testnet",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Clover", symbol: "CLV", decimals: 18 },
        infoURL: "https://clover.finance",
        shortName: "tclv",
        chainId: 1023,
        networkId: 1023
      },
      {
        name: "Clover Mainnet",
        chain: "Clover",
        network: "clover mainnet",
        rpc: [
          "https://rpc-ivy.clover.finance",
          "https://rpc-ivy-2.clover.finance",
          "https://rpc-ivy-3.clover.finance"
        ],
        faucets: [],
        nativeCurrency: { name: "Clover", symbol: "CLV", decimals: 18 },
        infoURL: "https://clover.finance",
        shortName: "clv",
        chainId: 1024,
        networkId: 1024
      },
      {
        name: "MathChain",
        chain: "MATH",
        network: "mainnet",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "MathChain", symbol: "MATH", decimals: 18 },
        infoURL: "https://mathchain.org",
        shortName: "MATH",
        chainId: 1139,
        networkId: 1139
      },
      {
        name: "MathChain Testnet",
        chain: "MATH",
        network: "testnet",
        rpc: ["https://galois-hk.maiziqianbao.net/rpc"],
        faucets: ["https://scan.boka.network/#/Galois/faucet"],
        nativeCurrency: { name: "MathChain", symbol: "MATH", decimals: 18 },
        infoURL: "https://mathchain.org",
        shortName: "tMATH",
        chainId: 1140,
        networkId: 1140
      },
      {
        name: "Moonbeam",
        chain: "MOON",
        network: "moonbeam",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Glimmer", symbol: "GLMR", decimals: 18 },
        infoURL: "https://moonbeam.network/networks/moonbeam/",
        shortName: "mbeam",
        chainId: 1284,
        networkId: 1284
      },
      {
        name: "Moonriver",
        chain: "MOON",
        network: "moonriver",
        rpc: [
          "https://rpc.moonriver.moonbeam.network",
          "wss://wss.moonriver.moonbeam.network"
        ],
        faucets: [],
        nativeCurrency: { name: "Moonriver", symbol: "MOVR", decimals: 18 },
        infoURL: "https://moonbeam.network/networks/moonriver/",
        shortName: "mriver",
        chainId: 1285,
        networkId: 1285
      },
      {
        name: "Moonrock",
        chain: "MOON",
        network: "moonrock",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Rocs", symbol: "ROC", decimals: 18 },
        infoURL: "",
        shortName: "mrock",
        chainId: 1286,
        networkId: 1286
      },
      {
        name: "Moonbase Alpha",
        chain: "MOON",
        network: "moonbase",
        rpc: [
          "https://rpc.testnet.moonbeam.network",
          "wss://wss.testnet.moonbeam.network"
        ],
        faucets: [],
        nativeCurrency: { name: "Dev", symbol: "DEV", decimals: 18 },
        infoURL: "https://docs.moonbeam.network/networks/testnet/",
        shortName: "mbase",
        chainId: 1287,
        networkId: 1287
      },
      {
        name: "Moonshadow",
        chain: "MOON",
        network: "moonshadow",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Moonshadow", symbol: "MSHD", decimals: 18 },
        infoURL: "https://docs.moonbeam.network/networks/overview/",
        shortName: "mshadow",
        chainId: 1288,
        networkId: 1288
      },
      {
        name: "Catecoin Chain Mainnet",
        chain: "Catechain",
        network: "mainnet",
        rpc: ["https://send.catechain.com"],
        faucets: [],
        nativeCurrency: { name: "Catecoin", symbol: "CATE", decimals: 18 },
        infoURL: "https://catechain.com",
        shortName: "cate",
        chainId: 1618,
        networkId: 1618
      },
      {
        name: "Atheios",
        chain: "ATH",
        network: "mainnet",
        rpc: ["https://wallet.atheios.com:8797"],
        faucets: [],
        nativeCurrency: { name: "Atheios Ether", symbol: "ATH", decimals: 18 },
        infoURL: "https://atheios.com",
        shortName: "ath",
        chainId: 1620,
        networkId: 11235813,
        slip44: 1620
      },
      {
        name: "Teslafunds",
        chain: "TSF",
        network: "mainnet",
        rpc: ["https://tsfapi.europool.me"],
        faucets: [],
        nativeCurrency: { name: "Teslafunds Ether", symbol: "TSF", decimals: 18 },
        infoURL: "https://teslafunds.io",
        shortName: "tsf",
        chainId: 1856,
        networkId: 1
      },
      {
        name: "EtherGem",
        chain: "EGEM",
        network: "mainnet",
        rpc: ["https://jsonrpc.egem.io/custom"],
        faucets: [],
        nativeCurrency: { name: "EtherGem Ether", symbol: "EGEM", decimals: 18 },
        infoURL: "https://egem.io",
        shortName: "egem",
        chainId: 1987,
        networkId: 1987,
        slip44: 1987
      },
      {
        name: "420coin",
        chain: "420",
        network: "mainnet",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "Fourtwenty", symbol: "420", decimals: 18 },
        infoURL: "https://420integrated.com",
        shortName: "420",
        chainId: 2020,
        networkId: 2020
      },
      {
        name: "Edgeware Mainnet",
        chain: "EDG",
        network: "mainnet",
        rpc: ["https://mainnet1.edgewa.re"],
        faucets: [],
        nativeCurrency: { name: "Edge", symbol: "EDG", decimals: 18 },
        infoURL: "http://edgewa.re",
        shortName: "edg",
        chainId: 2021,
        networkId: 2021
      },
      {
        name: "Beresheet Testnet",
        chain: "EDG",
        network: "beresheet",
        rpc: ["https://beresheet1.edgewa.re"],
        faucets: [],
        nativeCurrency: { name: "Testnet Edge", symbol: "tEDG", decimals: 18 },
        infoURL: "http://edgewa.re",
        shortName: "edgt",
        chainId: 2022,
        networkId: 2022
      },
      {
        name: "Kortho Mainnet",
        chain: "Kortho Chain",
        network: "mainnet",
        rpc: ["https://www.kortho-chain.com"],
        faucets: [],
        nativeCurrency: { name: "KorthoChain", symbol: "KTO", decimals: 11 },
        infoURL: "https://www.kortho.io/",
        shortName: "ktoc",
        chainId: 2559,
        networkId: 2559
      },
      {
        name: "Fantom Testnet",
        chain: "FTM",
        network: "testnet",
        rpc: ["https://rpc.testnet.fantom.network"],
        faucets: ["https://faucet.fantom.network"],
        nativeCurrency: { name: "Fantom", symbol: "FTM", decimals: 18 },
        infoURL: "https://docs.fantom.foundation/quick-start/short-guide#fantom-testnet",
        shortName: "tftm",
        chainId: 4002,
        networkId: 4002,
        icon: "fantom",
        explorers: [
          {
            name: "ftmscan",
            url: "https://testnet.ftmscan.com/",
            icon: "ftmscan",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "IoTeX Network Mainnet",
        chain: "iotex.io",
        network: "mainnet",
        rpc: ["https://babel-api.mainnet.iotex.io"],
        faucets: [],
        nativeCurrency: { name: "IoTeX", symbol: "IOTX", decimals: 18 },
        infoURL: "https://iotex.io",
        shortName: "iotex-mainnet",
        chainId: 4689,
        networkId: 4689,
        explorers: [
          {
            name: "iotexscan",
            url: "https://iotexscan.io",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "IoTeX Network Testnet",
        chain: "iotex.io",
        network: "testnet",
        rpc: ["https://babel-api.testnet.iotex.io"],
        faucets: ["https://faucet.iotex.io/"],
        nativeCurrency: { name: "IoTeX", symbol: "IOTX", decimals: 18 },
        infoURL: "https://iotex.io",
        shortName: "iotex-testnet",
        chainId: 4690,
        networkId: 4690,
        explorers: [
          {
            name: "testnet iotexscan",
            url: "https://testnet.iotexscan.io",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "EraSwap Mainnet",
        chain: "ESN",
        network: "mainnet",
        icon: "eraswap",
        rpc: [
          "https://mainnet.eraswap.network",
          "https://rpc-mumbai.mainnet.eraswap.network"
        ],
        faucets: [],
        nativeCurrency: { name: "EraSwap", symbol: "ES", decimals: 18 },
        infoURL: "https://eraswap.info/",
        shortName: "es",
        chainId: 5197,
        networkId: 5197
      },
      {
        name: "Syscoin Tanenbaum Testnet",
        chain: "SYS",
        network: "testnet",
        rpc: ["https://rpc.tanenbaum.io", "wss://rpc.tanenbaum.io/wss"],
        faucets: ["https://faucet.tanenbaum.io"],
        nativeCurrency: { name: "Testnet Syscoin", symbol: "tSYS", decimals: 18 },
        infoURL: "https://syscoin.org",
        shortName: "tsys",
        chainId: 5700,
        networkId: 5700
      },
      {
        name: "Ontology Testnet",
        chain: "Ontology",
        network: "testnet",
        rpc: [
          "https://polaris1.ont.io:20339",
          "https://polaris2.ont.io:20339",
          "https://polaris3.ont.io:20339",
          "https://polaris4.ont.io:20339"
        ],
        faucets: ["https://developer.ont.io/"],
        nativeCurrency: { name: "ONG", symbol: "ONG", decimals: 9 },
        infoURL: "https://ont.io/",
        shortName: "Ontology Testnet",
        chainId: 5851,
        networkId: 5851,
        explorers: [
          {
            name: "explorer",
            url: "https://explorer.ont.io/testnet",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Wegochain Rubidium Mainnet",
        chain: "RBD",
        network: "mainnet",
        rpc: ["https://proxy.wegochain.io", "http://wallet.wegochain.io:7764"],
        faucets: [],
        nativeCurrency: { name: "Rubid", symbol: "RBD", decimals: 18 },
        infoURL: "http://wegochain.io",
        shortName: "rbd",
        chainId: 5869,
        networkId: 5869
      },
      {
        name: "MDGL Testnet",
        chain: "MDGL",
        network: "testnet",
        rpc: ["https://testnet.mdgl.io"],
        faucets: [],
        nativeCurrency: { name: "MDGL Token", symbol: "MDGLT", decimals: 18 },
        infoURL: "https://mdgl.io",
        shortName: "mdgl",
        chainId: 8029,
        networkId: 8029
      },
      {
        name: "GeneChain Adenine Testnet",
        chain: "GeneChain",
        network: "adenine",
        rpc: ["https://rpc-testnet.genechain.io"],
        faucets: ["https://faucet.genechain.io"],
        nativeCurrency: { name: "Testnet RNA", symbol: "tRNA", decimals: 18 },
        infoURL: "https://scan-testnet.genechain.io/",
        shortName: "GeneChainAdn",
        chainId: 8080,
        networkId: 8080,
        explorers: [
          {
            name: "GeneChain Adenine Testnet Scan",
            url: "https://scan-testnet.genechain.io",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Klaytn Mainnet Cypress",
        chain: "KLAY",
        network: "cypress",
        rpc: ["https://node-api.klaytnapi.com/v1/klaytn"],
        faucets: [],
        nativeCurrency: { name: "KLAY", symbol: "KLAY", decimals: 18 },
        infoURL: "https://www.klaytn.com/",
        shortName: "Cypress",
        chainId: 8217,
        networkId: 8217,
        slip44: 8217
      },
      {
        name: "KorthoTest",
        chain: "Kortho",
        network: "Test",
        rpc: ["https://www.krotho-test.net"],
        faucets: [],
        nativeCurrency: { name: "Kortho Test", symbol: "KTO", decimals: 11 },
        infoURL: "https://www.kortho.io/",
        shortName: "Kortho",
        chainId: 8285,
        networkId: 8285
      },
      {
        name: "TOOL Global Mainnet",
        chain: "OLO",
        network: "mainnet",
        rpc: ["https://mainnet-web3.wolot.io"],
        faucets: [],
        nativeCurrency: { name: "TOOL Global", symbol: "OLO", decimals: 18 },
        infoURL: "https://ibdt.io",
        shortName: "olo",
        chainId: 8723,
        networkId: 8723,
        slip44: 479,
        explorers: [
          {
            name: "OLO Block Explorer",
            url: "https://www.olo.network",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "TOOL Global Testnet",
        chain: "OLO",
        network: "testnet",
        rpc: ["https://testnet-web3.wolot.io"],
        faucets: ["https://testnet-explorer.wolot.io"],
        nativeCurrency: { name: "TOOL Global", symbol: "OLO", decimals: 18 },
        infoURL: "https://testnet-explorer.wolot.io",
        shortName: "tolo",
        chainId: 8724,
        networkId: 8724,
        slip44: 479
      },
      {
        name: "bloxberg",
        chain: "bloxberg",
        network: "mainnet",
        rpc: ["https://core.bloxberg.org"],
        faucets: ["https://faucet.bloxberg.org/"],
        nativeCurrency: { name: "BERG", symbol: "U+25B3", decimals: 18 },
        infoURL: "https://bloxberg.org",
        shortName: "berg",
        chainId: 8995,
        networkId: 8995
      },
      {
        name: "Smart Bitcoin Cash",
        chain: "smartBCH",
        network: "mainnet",
        rpc: [
          "https://smartbch.greyh.at",
          "https://rpc-mainnet.smartbch.org",
          "https://smartbch.fountainhead.cash/mainnet"
        ],
        faucets: [],
        nativeCurrency: { name: "Bitcoin Cash", symbol: "BCH", decimals: 18 },
        infoURL: "https://smartbch.org/",
        shortName: "smartbch",
        chainId: 1e4,
        networkId: 1e4
      },
      {
        name: "Smart Bitcoin Cash Testnet",
        chain: "smartBCHTest",
        network: "testnet",
        rpc: ["https://rpc-testnet.smartbch.org"],
        faucets: [],
        nativeCurrency: { name: "Bitcoin Cash Test Token", symbol: "BCHT", decimals: 18 },
        infoURL: "http://smartbch.org/",
        shortName: "smartbchtest",
        chainId: 10001,
        networkId: 10001
      },
      {
        name: "Blockchain Genesis Mainnet",
        chain: "GEN",
        network: "mainnet",
        rpc: [
          "https://eu.mainnet.xixoio.com",
          "https://us.mainnet.xixoio.com",
          "https://asia.mainnet.xixoio.com"
        ],
        faucets: [],
        nativeCurrency: { name: "GEN", symbol: "GEN", decimals: 18 },
        infoURL: "https://www.xixoio.com/",
        shortName: "GEN",
        chainId: 10101,
        networkId: 10101
      },
      {
        name: "MetaDot Mainnet",
        chain: "MTT",
        network: "mainnet",
        rpc: ["https://mainnet.metadot.network"],
        faucets: [],
        nativeCurrency: { name: "MetaDot Token", symbol: "MTT", decimals: 18 },
        infoURL: "https://metadot.network",
        shortName: "mtt",
        chainId: 16e3,
        networkId: 16e3
      },
      {
        name: "MetaDot Testnet",
        chain: "MTTTest",
        network: "devnet",
        rpc: ["https://testnet.metadot.network"],
        faucets: ["https://faucet.metadot.network/"],
        nativeCurrency: { name: "MetaDot Token TestNet", symbol: "MTT-test", decimals: 18 },
        infoURL: "https://metadot.network",
        shortName: "mtttest",
        chainId: 16001,
        networkId: 16001
      },
      {
        name: "Webchain",
        chain: "WEB",
        network: "mainnet",
        rpc: ["https://node1.webchain.network"],
        faucets: [],
        nativeCurrency: { name: "Webchain Ether", symbol: "WEB", decimals: 18 },
        infoURL: "https://webchain.network",
        shortName: "web",
        chainId: 24484,
        networkId: 37129
      },
      {
        name: "MintMe.com Coin",
        chain: "MINTME",
        network: "mainnet",
        rpc: ["https://node1.mintme.com"],
        faucets: [],
        nativeCurrency: { name: "MintMe.com Coin", symbol: "MINTME", decimals: 18 },
        infoURL: "https://www.mintme.com",
        shortName: "mintme",
        chainId: 24734,
        networkId: 37480
      },
      {
        name: "Ethersocial Network",
        chain: "ESN",
        network: "mainnet",
        rpc: ["https://api.esn.gonspool.com"],
        faucets: [],
        nativeCurrency: { name: "Ethersocial Network Ether", symbol: "ESN", decimals: 18 },
        infoURL: "https://ethersocial.org",
        shortName: "esn",
        chainId: 31102,
        networkId: 1,
        slip44: 31102
      },
      {
        name: "GoChain Testnet",
        chain: "GO",
        network: "testnet",
        rpc: ["https://testnet-rpc.gochain.io"],
        faucets: [],
        nativeCurrency: { name: "GoChain Coin", symbol: "GO", decimals: 18 },
        infoURL: "https://gochain.io",
        shortName: "got",
        chainId: 31337,
        networkId: 31337,
        slip44: 6060,
        explorers: [
          {
            name: "GoChain Testnet Explorer",
            url: "https://testnet-explorer.gochain.io",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Fusion Mainnet",
        chain: "FSN",
        network: "mainnet",
        rpc: ["https://mainnet.anyswap.exchange", "https://fsn.dev/api"],
        faucets: [],
        nativeCurrency: { name: "Fusion", symbol: "FSN", decimals: 18 },
        infoURL: "https://www.fusion.org/",
        shortName: "fsn",
        chainId: 32659,
        networkId: 32659
      },
      {
        name: "Energi Mainnet",
        chain: "NRG",
        network: "mainnet",
        rpc: ["https://nodeapi.gen3.energi.network"],
        faucets: [],
        nativeCurrency: { name: "Energi", symbol: "NRG", decimals: 18 },
        infoURL: "https://www.energi.world/",
        shortName: "nrg",
        chainId: 39797,
        networkId: 39797,
        slip44: 39797
      },
      {
        name: "pegglecoin",
        chain: "42069",
        network: "mainnet",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "pegglecoin", symbol: "peggle", decimals: 18 },
        infoURL: "https://teampeggle.com",
        shortName: "PC",
        chainId: 42069,
        networkId: 42069
      },
      {
        name: "Arbitrum One",
        chainId: 42161,
        shortName: "arb1",
        chain: "ETH",
        network: "mainnet",
        networkId: 42161,
        nativeCurrency: { name: "Ether", symbol: "AETH", decimals: 18 },
        rpc: [
          "https://mainnet.infura.io/v3/${INFURA_API_KEY}",
          "https://arb-mainnet.g.alchemy.com/v2/${ALCHEMY_API_KEY}",
          "https://arb1.arbitrum.io/rpc",
          "wss://arb1.arbitrum.io/ws"
        ],
        faucets: [],
        explorers: [
          {
            name: "Arbiscan",
            url: "https://arbiscan.io",
            standard: "EIP3091"
          },
          {
            name: "Arbitrum Explorer",
            url: "https://explorer.arbitrum.io",
            standard: "EIP3091"
          }
        ],
        infoURL: "https://arbitrum.io",
        parent: {
          type: "L2",
          chain: "eip155-1",
          bridges: [{ url: "https://bridge.arbitrum.io" }]
        }
      },
      {
        name: "Celo Mainnet",
        chainId: 42220,
        shortName: "CELO",
        chain: "CELO",
        network: "Mainnet",
        networkId: 42220,
        nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
        rpc: ["https://forno.celo.org", "wss://forno.celo.org/ws"],
        faucets: [],
        infoURL: "https://docs.celo.org/"
      },
      {
        name: "Athereum",
        chain: "ATH",
        network: "athereum",
        rpc: ["https://ava.network:21015/ext/evm/rpc"],
        faucets: ["http://athfaucet.ava.network//?address=${ADDRESS}"],
        nativeCurrency: { name: "Athereum Ether", symbol: "ATH", decimals: 18 },
        infoURL: "https://athereum.ava.network",
        shortName: "avaeth",
        chainId: 43110,
        networkId: 43110
      },
      {
        name: "Avalanche Fuji Testnet",
        chain: "AVAX",
        network: "testnet",
        rpc: ["https://api.avax-test.network/ext/bc/C/rpc"],
        faucets: ["https://faucet.avax-test.network/"],
        nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
        infoURL: "https://cchain.explorer.avax-test.network",
        shortName: "Fuji",
        chainId: 43113,
        networkId: 1
      },
      {
        name: "Avalanche Mainnet",
        chain: "AVAX",
        network: "mainnet",
        rpc: ["https://api.avax.network/ext/bc/C/rpc"],
        faucets: [],
        nativeCurrency: { name: "Avalanche", symbol: "AVAX", decimals: 18 },
        infoURL: "https://cchain.explorer.avax.network/",
        shortName: "Avalanche",
        chainId: 43114,
        networkId: 1
      },
      {
        name: "Celo Alfajores Testnet",
        chainId: 44787,
        shortName: "ALFA",
        chain: "CELO",
        network: "Alfajores",
        networkId: 44787,
        nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
        rpc: [
          "https://alfajores-forno.celo-testnet.org",
          "wss://alfajores-forno.celo-testnet.org/ws"
        ],
        faucets: [
          "https://celo.org/developers/faucet",
          "https://cauldron.pretoriaresearchlab.io/alfajores-faucet"
        ],
        infoURL: "https://docs.celo.org/"
      },
      {
        name: "Energi Testnet",
        chain: "NRG",
        network: "testnet",
        rpc: ["https://nodeapi.test3.energi.network"],
        faucets: [],
        nativeCurrency: { name: "Energi", symbol: "tNRG", decimals: 18 },
        infoURL: "https://www.energi.world/",
        shortName: "tnrg",
        chainId: 49797,
        networkId: 49797,
        slip44: 49797
      },
      {
        name: "Celo Baklava Testnet",
        chainId: 62320,
        shortName: "BKLV",
        chain: "CELO",
        network: "Baklava",
        networkId: 62320,
        nativeCurrency: { name: "CELO", symbol: "CELO", decimals: 18 },
        rpc: ["https://baklava-forno.celo-testnet.org"],
        faucets: [
          "https://docs.google.com/forms/d/e/1FAIpQLSdfr1BwUTYepVmmvfVUDRCwALejZ-TUva2YujNpvrEmPAX2pg/viewform",
          "https://cauldron.pretoriaresearchlab.io/baklava-faucet"
        ],
        infoURL: "https://docs.celo.org/"
      },
      {
        name: "Polyjuice Testnet",
        chain: "CKB",
        network: "testnet",
        icon: "polyjuice",
        rpc: [
          "https://godwoken-testnet-web3-rpc.ckbapp.dev",
          "ws://godwoken-testnet-web3-rpc.ckbapp.dev/ws"
        ],
        faucets: ["https://faucet.nervos.org/"],
        nativeCurrency: { name: "CKB", symbol: "CKB", decimals: 8 },
        infoURL: "https://github.com/nervosnetwork/godwoken",
        shortName: "ckb",
        chainId: 71393,
        networkId: 1
      },
      {
        name: "Energy Web Volta Testnet",
        chain: "Volta",
        network: "testnet",
        rpc: [
          "https://volta-rpc.energyweb.org",
          "wss://volta-rpc.energyweb.org/ws"
        ],
        faucets: ["https://voltafaucet.energyweb.org"],
        nativeCurrency: { name: "Volta Token", symbol: "VT", decimals: 18 },
        infoURL: "https://energyweb.org",
        shortName: "vt",
        chainId: 73799,
        networkId: 73799
      },
      {
        name: "Firenze test network",
        chain: "ETH",
        network: "testnet",
        rpc: ["https://ethnode.primusmoney.com/firenze"],
        faucets: [],
        nativeCurrency: { name: "Firenze Ether", symbol: "FIN", decimals: 18 },
        infoURL: "https://primusmoney.com",
        shortName: "firenze",
        chainId: 78110,
        networkId: 78110
      },
      {
        name: "Matic(Polygon) Testnet Mumbai",
        chain: "Matic(Polygon)",
        network: "testnet",
        rpc: ["https://rpc-mumbai.matic.today", "wss://ws-mumbai.matic.today"],
        faucets: ["https://faucet.matic.network/"],
        nativeCurrency: { name: "Matic", symbol: "tMATIC", decimals: 18 },
        infoURL: "https://matic.network/",
        shortName: "maticmum",
        chainId: 80001,
        networkId: 80001,
        explorers: [
          {
            name: "polygonscan",
            url: "https://mumbai.polygonscan.com/",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "QuarkChain Mainnet Root",
        chain: "QuarkChain",
        network: "mainnet",
        rpc: ["http://jrpc.mainnet.quarkchain.io:38391/"],
        faucets: [],
        nativeCurrency: { name: "QKC", symbol: "QKC", decimals: 18 },
        infoURL: "https://www.quarkchain.io/",
        shortName: "qkc-r",
        chainId: 1e5,
        networkId: 1e5
      },
      {
        name: "QuarkChain Mainnet Shard 0",
        chain: "QuarkChain",
        network: "mainnet",
        rpc: ["http://eth-jrpc.mainnet.quarkchain.io:39000/"],
        faucets: [],
        nativeCurrency: { name: "QKC", symbol: "QKC", decimals: 18 },
        infoURL: "https://www.quarkchain.io/",
        shortName: "qkc-s0",
        chainId: 100001,
        networkId: 100001,
        parent: { chain: "eip155-100000", type: "shard" },
        explorers: [
          {
            name: "quarkchain-mainnet",
            url: "https://mainnet.quarkchain.io/0",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "QuarkChain Mainnet Shard 1",
        chain: "QuarkChain",
        network: "mainnet",
        rpc: ["http://eth-jrpc.mainnet.quarkchain.io:39001/"],
        faucets: [],
        nativeCurrency: { name: "QKC", symbol: "QKC", decimals: 18 },
        infoURL: "https://www.quarkchain.io/",
        shortName: "qkc-s1",
        chainId: 100002,
        networkId: 100002,
        parent: { chain: "eip155-100000", type: "shard" },
        explorers: [
          {
            name: "quarkchain-mainnet",
            url: "https://mainnet.quarkchain.io/1",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "QuarkChain Mainnet Shard 2",
        chain: "QuarkChain",
        network: "mainnet",
        rpc: ["http://eth-jrpc.mainnet.quarkchain.io:39002/"],
        faucets: [],
        nativeCurrency: { name: "QKC", symbol: "QKC", decimals: 18 },
        infoURL: "https://www.quarkchain.io/",
        shortName: "qkc-s2",
        chainId: 100003,
        networkId: 100003,
        parent: { chain: "eip155-100000", type: "shard" },
        explorers: [
          {
            name: "quarkchain-mainnet",
            url: "https://mainnet.quarkchain.io/2",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "QuarkChain Mainnet Shard 3",
        chain: "QuarkChain",
        network: "mainnet",
        rpc: ["http://eth-jrpc.mainnet.quarkchain.io:39003/"],
        faucets: [],
        nativeCurrency: { name: "QKC", symbol: "QKC", decimals: 18 },
        infoURL: "https://www.quarkchain.io/",
        shortName: "qkc-s3",
        chainId: 100004,
        networkId: 100004,
        parent: { chain: "eip155-100000", type: "shard" },
        explorers: [
          {
            name: "quarkchain-mainnet",
            url: "https://mainnet.quarkchain.io/3",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "QuarkChain Mainnet Shard 4",
        chain: "QuarkChain",
        network: "mainnet",
        rpc: ["http://eth-jrpc.mainnet.quarkchain.io:39004/"],
        faucets: [],
        nativeCurrency: { name: "QKC", symbol: "QKC", decimals: 18 },
        infoURL: "https://www.quarkchain.io/",
        shortName: "qkc-s4",
        chainId: 100005,
        networkId: 100005,
        parent: { chain: "eip155-100000", type: "shard" },
        explorers: [
          {
            name: "quarkchain-mainnet",
            url: "https://mainnet.quarkchain.io/4",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "QuarkChain Mainnet Shard 5",
        chain: "QuarkChain",
        network: "mainnet",
        rpc: ["http://eth-jrpc.mainnet.quarkchain.io:39005/"],
        faucets: [],
        nativeCurrency: { name: "QKC", symbol: "QKC", decimals: 18 },
        infoURL: "https://www.quarkchain.io/",
        shortName: "qkc-s5",
        chainId: 100006,
        networkId: 100006,
        parent: { chain: "eip155-100000", type: "shard" },
        explorers: [
          {
            name: "quarkchain-mainnet",
            url: "https://mainnet.quarkchain.io/5",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "QuarkChain Mainnet Shard 6",
        chain: "QuarkChain",
        network: "mainnet",
        rpc: ["http://eth-jrpc.mainnet.quarkchain.io:39006/"],
        faucets: [],
        nativeCurrency: { name: "QKC", symbol: "QKC", decimals: 18 },
        infoURL: "https://www.quarkchain.io/",
        shortName: "qkc-s6",
        chainId: 100007,
        networkId: 100007,
        parent: { chain: "eip155-100000", type: "shard" },
        explorers: [
          {
            name: "quarkchain-mainnet",
            url: "https://mainnet.quarkchain.io/6",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "QuarkChain Mainnet Shard 7",
        chain: "QuarkChain",
        network: "mainnet",
        rpc: ["http://eth-jrpc.mainnet.quarkchain.io:39007/"],
        faucets: [],
        nativeCurrency: { name: "QKC", symbol: "QKC", decimals: 18 },
        infoURL: "https://www.quarkchain.io/",
        shortName: "qkc-s7",
        chainId: 100008,
        networkId: 100008,
        parent: { chain: "eip155-100000", type: "shard" },
        explorers: [
          {
            name: "quarkchain-mainnet",
            url: "https://mainnet.quarkchain.io/7",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "QuarkChain Devnet Root",
        chain: "QuarkChain",
        network: "devnet",
        rpc: ["http://jrpc.devnet.quarkchain.io:38391/"],
        faucets: [],
        nativeCurrency: { name: "QKC", symbol: "QKC", decimals: 18 },
        infoURL: "https://www.quarkchain.io/",
        shortName: "qkc-d-r",
        chainId: 11e4,
        networkId: 11e4
      },
      {
        name: "QuarkChain Devnet Shard 0",
        chain: "QuarkChain",
        network: "devnet",
        rpc: ["http://eth-jrpc.devnet.quarkchain.io:39900/"],
        faucets: [],
        nativeCurrency: { name: "QKC", symbol: "QKC", decimals: 18 },
        infoURL: "https://www.quarkchain.io/",
        shortName: "qkc-d-s0",
        chainId: 110001,
        networkId: 110001,
        parent: { chain: "eip155-110000", type: "shard" },
        explorers: [
          {
            name: "quarkchain-devnet",
            url: "https://devnet.quarkchain.io/0",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "QuarkChain Devnet Shard 1",
        chain: "QuarkChain",
        network: "devnet",
        rpc: ["http://eth-jrpc.devnet.quarkchain.io:39901/"],
        faucets: [],
        nativeCurrency: { name: "QKC", symbol: "QKC", decimals: 18 },
        infoURL: "https://www.quarkchain.io/",
        shortName: "qkc-d-s1",
        chainId: 110002,
        networkId: 110002,
        parent: { chain: "eip155-110000", type: "shard" },
        explorers: [
          {
            name: "quarkchain-devnet",
            url: "https://devnet.quarkchain.io/1",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "QuarkChain Devnet Shard 2",
        chain: "QuarkChain",
        network: "devnet",
        rpc: ["http://eth-jrpc.devnet.quarkchain.io:39902/"],
        faucets: [],
        nativeCurrency: { name: "QKC", symbol: "QKC", decimals: 18 },
        infoURL: "https://www.quarkchain.io/",
        shortName: "qkc-d-s2",
        chainId: 110003,
        networkId: 110003,
        parent: { chain: "eip155-110000", type: "shard" },
        explorers: [
          {
            name: "quarkchain-devnet",
            url: "https://devnet.quarkchain.io/2",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "QuarkChain Devnet Shard 3",
        chain: "QuarkChain",
        network: "devnet",
        rpc: ["http://eth-jrpc.devnet.quarkchain.io:39903/"],
        faucets: [],
        nativeCurrency: { name: "QKC", symbol: "QKC", decimals: 18 },
        infoURL: "https://www.quarkchain.io/",
        shortName: "qkc-d-s3",
        chainId: 110004,
        networkId: 110004,
        parent: { chain: "eip155-110000", type: "shard" },
        explorers: [
          {
            name: "quarkchain-devnet",
            url: "https://devnet.quarkchain.io/3",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "QuarkChain Devnet Shard 4",
        chain: "QuarkChain",
        network: "devnet",
        rpc: ["http://eth-jrpc.devnet.quarkchain.io:39904/"],
        faucets: [],
        nativeCurrency: { name: "QKC", symbol: "QKC", decimals: 18 },
        infoURL: "https://www.quarkchain.io/",
        shortName: "qkc-d-s4",
        chainId: 110005,
        networkId: 110005,
        parent: { chain: "eip155-110000", type: "shard" },
        explorers: [
          {
            name: "quarkchain-devnet",
            url: "https://devnet.quarkchain.io/4",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "QuarkChain Devnet Shard 5",
        chain: "QuarkChain",
        network: "devnet",
        rpc: ["http://eth-jrpc.devnet.quarkchain.io:39905/"],
        faucets: [],
        nativeCurrency: { name: "QKC", symbol: "QKC", decimals: 18 },
        infoURL: "https://www.quarkchain.io/",
        shortName: "qkc-d-s5",
        chainId: 110006,
        networkId: 110006,
        parent: { chain: "eip155-110000", type: "shard" },
        explorers: [
          {
            name: "quarkchain-devnet",
            url: "https://devnet.quarkchain.io/5",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "QuarkChain Devnet Shard 6",
        chain: "QuarkChain",
        network: "devnet",
        rpc: ["http://eth-jrpc.devnet.quarkchain.io:39906/"],
        faucets: [],
        nativeCurrency: { name: "QKC", symbol: "QKC", decimals: 18 },
        infoURL: "https://www.quarkchain.io/",
        shortName: "qkc-d-s6",
        chainId: 110007,
        networkId: 110007,
        parent: { chain: "eip155-110000", type: "shard" },
        explorers: [
          {
            name: "quarkchain-devnet",
            url: "https://devnet.quarkchain.io/6",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "QuarkChain Devnet Shard 7",
        chain: "QuarkChain",
        network: "devnet",
        rpc: ["http://eth-jrpc.devnet.quarkchain.io:39907/"],
        faucets: [],
        nativeCurrency: { name: "QKC", symbol: "QKC", decimals: 18 },
        infoURL: "https://www.quarkchain.io/",
        shortName: "qkc-d-s7",
        chainId: 110008,
        networkId: 110008,
        parent: { chain: "eip155-110000", type: "shard" },
        explorers: [
          {
            name: "quarkchain-devnet",
            url: "https://devnet.quarkchain.io/7",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Akroma",
        chain: "AKA",
        network: "mainnet",
        rpc: ["https://remote.akroma.io"],
        faucets: [],
        nativeCurrency: { name: "Akroma Ether", symbol: "AKA", decimals: 18 },
        infoURL: "https://akroma.io",
        shortName: "aka",
        chainId: 200625,
        networkId: 200625,
        slip44: 200625
      },
      {
        name: "ARTIS sigma1",
        chain: "ARTIS",
        network: "sigma1",
        rpc: ["https://rpc.sigma1.artis.network"],
        faucets: [],
        nativeCurrency: { name: "ARTIS sigma1 Ether", symbol: "ATS", decimals: 18 },
        infoURL: "https://artis.eco",
        shortName: "ats",
        chainId: 246529,
        networkId: 246529,
        slip44: 246529
      },
      {
        name: "ARTIS Testnet tau1",
        chain: "ARTIS",
        network: "tau1",
        rpc: ["https://rpc.tau1.artis.network"],
        faucets: [],
        nativeCurrency: { name: "ARTIS tau1 Ether", symbol: "tATS", decimals: 18 },
        infoURL: "https://artis.network",
        shortName: "atstau",
        chainId: 246785,
        networkId: 246785
      },
      {
        name: "Polis Testnet",
        chain: "Sparta",
        network: "testnet",
        icon: "polis",
        rpc: ["https://sparta-rpc.polis.tech"],
        faucets: ["https://faucet.polis.tech"],
        nativeCurrency: { name: "tPolis", symbol: "tPOLIS", decimals: 18 },
        infoURL: "https://polis.tech",
        shortName: "sparta",
        chainId: 333888,
        networkId: 333888
      },
      {
        name: "Polis Mainnet",
        chain: "Olympus",
        network: "mainnet",
        icon: "polis",
        rpc: ["https://rpc.polis.tech"],
        faucets: ["https://faucet.polis.tech"],
        nativeCurrency: { name: "Polis", symbol: "POLIS", decimals: 18 },
        infoURL: "https://polis.tech",
        shortName: "olympus",
        chainId: 333999,
        networkId: 333999
      },
      {
        name: "Arbitrum Testnet Rinkeby",
        chainId: 421611,
        shortName: "arb-rinkeby",
        chain: "ETH",
        network: "rinkeby",
        networkId: 421611,
        nativeCurrency: { name: "Arbitrum Rinkeby Ether", symbol: "ARETH", decimals: 18 },
        rpc: [
          "https://rinkeby.arbitrum.io/rpc",
          "wss://rinkeby.arbitrum.io/ws"
        ],
        faucets: [],
        infoURL: "https://arbitrum.io",
        explorers: [
          {
            name: "arbitrum-rinkeby",
            url: "https://rinkeby-explorer.arbitrum.io",
            standard: "EIP3091"
          }
        ],
        parent: {
          type: "L2",
          chain: "eip155-4",
          bridges: [{ url: "https://bridge.arbitrum.io" }]
        }
      },
      {
        name: "Ether-1",
        chain: "ETHO",
        network: "mainnet",
        rpc: ["https://rpc.ether1.org"],
        faucets: [],
        nativeCurrency: { name: "Ether-1 Ether", symbol: "ETHO", decimals: 18 },
        infoURL: "https://ether1.org",
        shortName: "etho",
        chainId: 1313114,
        networkId: 1313114,
        slip44: 1313114
      },
      {
        name: "Xerom",
        chain: "XERO",
        network: "mainnet",
        rpc: ["https://rpc.xerom.org"],
        faucets: [],
        nativeCurrency: { name: "Xerom Ether", symbol: "XERO", decimals: 18 },
        infoURL: "https://xerom.org",
        shortName: "xero",
        chainId: 1313500,
        networkId: 1313500
      },
      {
        name: "Musicoin",
        chain: "MUSIC",
        network: "mainnet",
        rpc: ["https://mewapi.musicoin.tw"],
        faucets: [],
        nativeCurrency: { name: "Musicoin", symbol: "MUSIC", decimals: 18 },
        infoURL: "https://musicoin.tw",
        shortName: "music",
        chainId: 7762959,
        networkId: 7762959,
        slip44: 184
      },
      {
        name: "PepChain Churchill",
        chain: "PEP",
        network: "testnet",
        rpc: ["https://churchill-rpc.pepchain.io"],
        faucets: [],
        nativeCurrency: { name: "PepChain Churchill Ether", symbol: "TPEP", decimals: 18 },
        infoURL: "https://pepchain.io",
        shortName: "tpep",
        chainId: 13371337,
        networkId: 13371337
      },
      {
        name: "IOLite",
        chain: "ILT",
        network: "mainnet",
        rpc: ["https://net.iolite.io"],
        faucets: [],
        nativeCurrency: { name: "IOLite Ether", symbol: "ILT", decimals: 18 },
        infoURL: "https://iolite.io",
        shortName: "ilt",
        chainId: 18289463,
        networkId: 18289463
      },
      {
        name: "quarkblockchain",
        chain: "QKI",
        network: "mainnet",
        rpc: ["https://hz.rpc.qkiscan.cn", "https://jp.rpc.qkiscan.io"],
        faucets: [],
        nativeCurrency: {
          name: "quarkblockchain Native Token",
          symbol: "QKI",
          decimals: 18
        },
        infoURL: "https://quarkblockchain.org/",
        shortName: "qki",
        chainId: 20181205,
        networkId: 20181205
      },
      {
        name: "Auxilium Network Mainnet",
        chain: "AUX",
        network: "mainnet",
        rpc: ["https://rpc.auxilium.global"],
        faucets: [],
        nativeCurrency: { name: "Auxilium coin", symbol: "AUX", decimals: 18 },
        infoURL: "https://auxilium.global",
        shortName: "auxi",
        chainId: 28945486,
        networkId: 28945486,
        slip44: 344
      },
      {
        name: "Joys Digital Mainnet",
        chain: "JOYS",
        network: "mainnet",
        rpc: ["https://node.joys.digital"],
        faucets: [],
        nativeCurrency: { name: "JOYS", symbol: "JOYS", decimals: 18 },
        infoURL: "https://joys.digital",
        shortName: "JOYS",
        chainId: 35855456,
        networkId: 35855456
      },
      {
        name: "Aquachain",
        chain: "AQUA",
        network: "mainnet",
        rpc: ["https://c.onical.org", "https://tx.aquacha.in/api"],
        faucets: ["https://aquacha.in/faucet"],
        nativeCurrency: { name: "Aquachain Ether", symbol: "AQUA", decimals: 18 },
        infoURL: "https://aquachain.github.io",
        shortName: "aqua",
        chainId: 61717561,
        networkId: 61717561,
        slip44: 61717561
      },
      {
        name: "Joys Digital TestNet",
        chain: "TOYS",
        network: "testnet",
        rpc: ["https://toys.joys.cash/"],
        faucets: ["https://faucet.joys.digital/"],
        nativeCurrency: { name: "TOYS", symbol: "TOYS", decimals: 18 },
        infoURL: "https://joys.digital",
        shortName: "TOYS",
        chainId: 99415706,
        networkId: 99415706
      },
      {
        name: "OneLedger Mainnet",
        chain: "OLT",
        network: "mainnet",
        icon: "oneledger",
        rpc: ["https://mainnet-rpc.oneledger.network"],
        faucets: [],
        nativeCurrency: { name: "OLT", symbol: "OLT", decimals: 18 },
        infoURL: "https://oneledger.io",
        shortName: "oneledger",
        chainId: 311752642,
        networkId: 311752642,
        explorers: [
          {
            name: "OneLedger Block Explorer",
            url: "https://mainnet-explorer.oneledger.network",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "IPOS Network",
        chain: "IPOS",
        network: "mainnet",
        rpc: ["https://rpc.iposlab.com", "https://rpc2.iposlab.com"],
        faucets: [],
        nativeCurrency: { name: "IPOS Network Ether", symbol: "IPOS", decimals: 18 },
        infoURL: "https://iposlab.com",
        shortName: "ipos",
        chainId: 1122334455,
        networkId: 1122334455
      },
      {
        name: "Aurora MainNet",
        chain: "NEAR",
        network: "mainnet",
        rpc: ["https://rpc.mainnet.aurora.dev:8545"],
        faucets: [],
        nativeCurrency: { name: "Ether", symbol: "aETH", decimals: 18 },
        infoURL: "https://aurora.dev",
        shortName: "aurora",
        chainId: 1313161554,
        networkId: 1313161554
      },
      {
        name: "Aurora TestNet",
        chain: "NEAR",
        network: "testnet",
        rpc: ["https://rpc.testnet.aurora.dev:8545"],
        faucets: [],
        nativeCurrency: { name: "Ether", symbol: "aETH", decimals: 18 },
        infoURL: "https://aurora.dev",
        shortName: "aurora-testnet",
        chainId: 1313161555,
        networkId: 1313161555
      },
      {
        name: "Aurora BetaNet",
        chain: "NEAR",
        network: "betanet",
        rpc: ["https://rpc.betanet.aurora.dev:8545"],
        faucets: [],
        nativeCurrency: { name: "Ether", symbol: "aETH", decimals: 18 },
        infoURL: "https://aurora.dev",
        shortName: "aurora-betanet",
        chainId: 1313161556,
        networkId: 1313161556
      },
      {
        name: "Harmony Mainnet Shard 0",
        chain: "Harmony",
        network: "mainnet",
        rpc: ["https://api.harmony.one"],
        faucets: [],
        nativeCurrency: { name: "ONE", symbol: "ONE", decimals: 18 },
        infoURL: "https://www.harmony.one/",
        shortName: "hmy-s0",
        chainId: 16666e5,
        networkId: 16666e5,
        explorers: [
          {
            name: "Harmony Block Explorer",
            url: "https://explorer.harmony.one",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Harmony Mainnet Shard 1",
        chain: "Harmony",
        network: "mainnet",
        rpc: ["https://s1.api.harmony.one"],
        faucets: [],
        nativeCurrency: { name: "ONE", symbol: "ONE", decimals: 18 },
        infoURL: "https://www.harmony.one/",
        shortName: "hmy-s1",
        chainId: 1666600001,
        networkId: 1666600001
      },
      {
        name: "Harmony Mainnet Shard 2",
        chain: "Harmony",
        network: "mainnet",
        rpc: ["https://s2.api.harmony.one"],
        faucets: [],
        nativeCurrency: { name: "ONE", symbol: "ONE", decimals: 18 },
        infoURL: "https://www.harmony.one/",
        shortName: "hmy-s2",
        chainId: 1666600002,
        networkId: 1666600002
      },
      {
        name: "Harmony Mainnet Shard 3",
        chain: "Harmony",
        network: "mainnet",
        rpc: ["https://s3.api.harmony.one"],
        faucets: [],
        nativeCurrency: { name: "ONE", symbol: "ONE", decimals: 18 },
        infoURL: "https://www.harmony.one/",
        shortName: "hmy-s3",
        chainId: 1666600003,
        networkId: 1666600003
      },
      {
        name: "Harmony Testnet Shard 0",
        chain: "Harmony",
        network: "testnet",
        rpc: ["https://api.s0.b.hmny.io"],
        faucets: ["https://faucet.pops.one"],
        nativeCurrency: { name: "ONE", symbol: "ONE", decimals: 18 },
        infoURL: "https://www.harmony.one/",
        shortName: "hmy-b-s0",
        chainId: 16667e5,
        networkId: 16667e5,
        explorers: [
          {
            name: "Harmony Testnet Block Explorer",
            url: "https://explorer.pops.one",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Harmony Testnet Shard 1",
        chain: "Harmony",
        network: "testnet",
        rpc: ["https://api.s1.b.hmny.io"],
        faucets: [],
        nativeCurrency: { name: "ONE", symbol: "ONE", decimals: 18 },
        infoURL: "https://www.harmony.one/",
        shortName: "hmy-b-s1",
        chainId: 1666700001,
        networkId: 1666700001
      },
      {
        name: "Harmony Testnet Shard 2",
        chain: "Harmony",
        network: "testnet",
        rpc: ["https://api.s2.b.hmny.io"],
        faucets: [],
        nativeCurrency: { name: "ONE", symbol: "ONE", decimals: 18 },
        infoURL: "https://www.harmony.one/",
        shortName: "hmy-b-s2",
        chainId: 1666700002,
        networkId: 1666700002
      },
      {
        name: "Harmony Testnet Shard 3",
        chain: "Harmony",
        network: "testnet",
        rpc: ["https://api.s3.b.hmny.io"],
        faucets: [],
        nativeCurrency: { name: "ONE", symbol: "ONE", decimals: 18 },
        infoURL: "https://www.harmony.one/",
        shortName: "hmy-b-s3",
        chainId: 1666700003,
        networkId: 1666700003
      },
      {
        name: "Pirl",
        chain: "PIRL",
        network: "mainnet",
        rpc: ["https://wallrpc.pirl.io"],
        faucets: [],
        nativeCurrency: { name: "Pirl Ether", symbol: "PIRL", decimals: 18 },
        infoURL: "https://pirl.io",
        shortName: "pirl",
        chainId: 3125659152,
        networkId: 3125659152,
        slip44: 164
      },
      {
        name: "OneLedger Testnet Frankenstein",
        chain: "OLT",
        network: "testnet",
        icon: "oneledger",
        rpc: ["https://frankenstein-rpc.oneledger.network"],
        faucets: ["https://frankenstein-faucet.oneledger.network"],
        nativeCurrency: { name: "OLT", symbol: "OLT", decimals: 18 },
        infoURL: "https://oneledger.io",
        shortName: "frankenstein",
        chainId: 4216137055,
        networkId: 4216137055,
        explorers: [
          {
            name: "OneLedger Block Explorer",
            url: "https://frankenstein-explorer.oneledger.network",
            standard: "EIP3091"
          }
        ]
      },
      {
        name: "Palm Testnet",
        chain: "Palm",
        network: "testnet",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "PALM", symbol: "PALM", decimals: 18 },
        infoURL: "https://palm.io",
        shortName: "tpalm",
        chainId: 11297108099,
        networkId: 11297108099
      },
      {
        name: "Palm Mainnet",
        chain: "Palm",
        network: "mainnet",
        rpc: [],
        faucets: [],
        nativeCurrency: { name: "PALM", symbol: "PALM", decimals: 18 },
        infoURL: "https://palm.io",
        shortName: "palm",
        chainId: 11297108109,
        networkId: 11297108109
      }
    ];
    getGlobalObject = () => {
      if (typeof globalThis !== "undefined") {
        return globalThis;
      }
      if (typeof self !== "undefined") {
        return self;
      }
      if (typeof window !== "undefined") {
        return window;
      }
      if (typeof global !== "undefined") {
        return global;
      }
      throw new Error("cannot find the global object");
    };
    Web3 = {};
    loadWeb3 = () => {
      if (Web3.version)
        return;
      try {
        Web3 = getGlobalObject().Web3 || {};
      } catch (err) {
        console.error("no globalThis.Web3 object");
      }
    };
    getWindowEthereum = () => {
      try {
        if (getGlobalObject().ethereum)
          return getGlobalObject().ethereum;
      } catch (err) {
        console.error("no globalThis.ethereum object");
      }
    };
    createStore = () => {
      const { subscribe: subscribe2, update: update3, set } = writable({
        connected: false,
        accounts: []
      });
      const init2 = () => {
        loadWeb3();
        if (!Web3.version)
          throw new Error("Cannot find Web3");
        if (getWindowEthereum())
          getWindowEthereum().autoRefreshOnNetworkChange = false;
      };
      const setProvider = async (provider, callback) => {
        init2();
        const instance = new Web3(provider);
        const chainId2 = await instance.eth.getChainId();
        const accounts = /127/.test(provider) ? [] : await instance.eth.getAccounts();
        if (callback) {
          instance._provider.removeListener("accountsChanged", () => setProvider(provider, true));
          instance._provider.removeListener("chainChanged", () => setProvider(provider, true));
        } else {
          if (instance._provider && instance._provider.on) {
            instance._provider.on("accountsChanged", () => setProvider(provider, true));
            instance._provider.on("chainChanged", () => setProvider(provider, true));
          }
        }
        update3(() => ({
          provider,
          providerType: "String",
          connected: true,
          chainId: chainId2,
          accounts,
          instance
        }));
      };
      const setBrowserProvider = async () => {
        init2();
        if (!getWindowEthereum())
          throw new Error("Please autorized browser extension (Metamask or similar)");
        const res = await getWindowEthereum().request({ method: "eth_requestAccounts" });
        getWindowEthereum().on("accountsChanged", setBrowserProvider);
        getWindowEthereum().on("chainChanged", setBrowserProvider);
        const instance = new Web3(getWindowEthereum());
        const chainId2 = await instance.eth.getChainId();
        update3(() => ({
          provider: getWindowEthereum(),
          providerType: "Browser",
          connected: true,
          chainId: chainId2,
          accounts: res,
          instance
        }));
      };
      const close = async (provider) => {
        if (provider && provider.disconnect) {
          await provider.disconnect();
        }
        update3(() => ({
          connected: false,
          accounts: []
        }));
      };
      return {
        setBrowserProvider,
        setProvider,
        close,
        subscribe: subscribe2
      };
    };
    allStores = {};
    noData = { rpc: [], faucets: [], nativeCurrency: {} };
    getData = (id) => {
      if (!id || !Web3.utils)
        return noData;
      if (Web3.utils.isHexStrict(id))
        id = Web3.utils.hexToNumber(id);
      for (const data of chains) {
        if (data.chainId === id)
          return data;
      }
      return noData;
    };
    makeChainStore = (name) => {
      const ethStore = allStores[name] = createStore();
      allStores[name].connected = derived(ethStore, ($ethStore) => $ethStore.connected);
      allStores[name].chainId = derived(ethStore, ($ethStore) => $ethStore.chainId);
      allStores[name].providerType = derived(ethStore, ($ethStore) => $ethStore.providerType);
      allStores[name].selectedAccount = derived(ethStore, ($ethStore) => {
        if ($ethStore.connected)
          return $ethStore.accounts.length ? $ethStore.accounts[0] : null;
        return null;
      });
      allStores[name].walletType = derived(ethStore, ($ethStore) => {
        if (!$ethStore.provider)
          return null;
        if (typeof $ethStore.provider === "string")
          return $ethStore.provider;
        if ($ethStore.provider.isMetaMask)
          return "MetaMask (or compatible)";
        if ($ethStore.provider.isNiftyWallet)
          return "Nifty";
        if ($ethStore.provider.isTrust)
          return "Trust";
        return "Unknown";
      });
      allStores[name].web3 = derived(ethStore, ($ethStore) => {
        if (!$ethStore.instance)
          return { utils: Web3.utils, version: Web3.version };
        return $ethStore.instance;
      });
      allStores[name].chainData = derived(ethStore, ($ethStore) => $ethStore.chainId ? getData($ethStore.chainId) : {});
      return allStores[name];
    };
    loadWeb3();
    makeChainStore("default");
    connected = allStores.default.connected;
    chainId = allStores.default.chainId;
    allStores.default.providerType;
    selectedAccount = allStores.default.selectedAccount;
    allStores.default.walletType;
    allStores.default.web3;
    allStores.default.chainData;
  }
});

// .svelte-kit/output/server/chunks/tabs-3e2d466f.js
var tabs_3e2d466f_exports = {};
__export(tabs_3e2d466f_exports, {
  default: () => Tabs,
  optionsBsc: () => optionsBsc,
  optionsPolygon: () => optionsPolygon
});
var optionsPolygon, optionsBsc, Tabs;
var init_tabs_3e2d466f = __esm({
  ".svelte-kit/output/server/chunks/tabs-3e2d466f.js"() {
    init_shims();
    init_app_171d3477();
    init_web3_store_7eaac438();
    init_index_8f6e8620();
    optionsPolygon = [
      {
        name: "polygon",
        image: "https://app.sushi.com/_next/image?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsushiswap%2Ficons%2Fmaster%2Fnetwork%2Fpolygon.jpg&w=48&q=75",
        id: "cake1",
        scritta: "polygon"
      },
      {
        name: "banana",
        image: "https://app.sushi.com/_next/image?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsushiswap%2Ficons%2Fmaster%2Fnetwork%2Fpolygon.jpg&w=48&q=75",
        id: "banana1",
        scritta: "polygon"
      }
    ];
    optionsBsc = [
      {
        name: "cake",
        image: "CAKE.svg",
        id: "cake1",
        scritta: "cake"
      },
      {
        name: "banana",
        image: "BANANA.svg",
        id: "banana1",
        scritta: "banana"
      },
      {
        name: "sYSL",
        image: "sYSL.svg",
        id: "sysl1",
        scritta: "sYSL"
      },
      {
        name: "BUSD-USDT",
        image: "BUSD-USDT.svg",
        id: "busd1",
        scritta: "BUSD-USDT"
      },
      {
        name: "CAKE-BUSD",
        image: "CAKE-BUSD.svg",
        id: "cakeb1",
        scritta: "CAKE-BUSD"
      }
    ];
    Tabs = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return ``;
    });
  }
});

// .svelte-kit/output/server/chunks/stakingTab-c9c49832.js
var stakingTab_c9c49832_exports = {};
__export(stakingTab_c9c49832_exports, {
  default: () => StakingTab
});
var StakingTab;
var init_stakingTab_c9c49832 = __esm({
  ".svelte-kit/output/server/chunks/stakingTab-c9c49832.js"() {
    init_shims();
    init_app_171d3477();
    StakingTab = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { name } = $$props;
      let { id } = $$props;
      let { image } = $$props;
      let { scritta } = $$props;
      if ($$props.name === void 0 && $$bindings.name && name !== void 0)
        $$bindings.name(name);
      if ($$props.id === void 0 && $$bindings.id && id !== void 0)
        $$bindings.id(id);
      if ($$props.image === void 0 && $$bindings.image && image !== void 0)
        $$bindings.image(image);
      if ($$props.scritta === void 0 && $$bindings.scritta && scritta !== void 0)
        $$bindings.scritta(scritta);
      return `<div class="${"ant-collapse-item earn-collapse"}"${add_attribute("this", name, 0)}><div class="${"ant-collapse-header"}" role="${"button"}" tabindex="${"0"}" aria-expanded="${"true"}"><span class="${"ant-collapse-arrow"}"><i class="${"icon-arrow_down"}"></i></span>
       <div class="${"EarnPage_EarnPage__table__header__2Nxkx"}"><img${add_attribute("src", image, 0)} alt="${"sYSL"}">
          <div class="${"EarnPage_EarnPage__table__header__info__23JmF"}"><p class="${"s_text__2O9ZL s_body2__d8EpH s_weight-semibold__2lhBJ s_primary-color__1S4LI EarnPage_EarnPage__table__title__2rgo3"}">${escape(scritta)}</p></div>
          <div class="${"EarnPage_EarnPage__table__info__TH6NY"}"><div class="${"EarnPage_EarnPage__table__balance__qMB8w"}"><div class="${"s_text__2O9ZL s_small__2mNdX s_secondary-color__3RLrb"}">Wallet</div>
                <span class="${"s_text__2O9ZL s_body3__3wlSS s_weight-semibold__2lhBJ s_secondary-color__3RLrb s_text-center__Zi9EM s_text_numbers__2nPsT EarnPage_hoverColor__14dYo"}">$0.00</span>
                <div class="${"EarnPage_EarnPage__table__sub__DRxXM"}"><div class="${"s_text__2O9ZL s_body3__3wlSS s_secondary-color__3RLrb s_text_numbers__2nPsT"}">$0.00</div></div></div>
             <div class="${"EarnPage_EarnPage__table__deposit__3MzjZ"}"><div class="${"s_text__2O9ZL s_small__2mNdX s_secondary-color__3RLrb"}">Balance</div>
                <span class="${"s_text__2O9ZL s_body2__d8EpH s_weight-semibold__2lhBJ s_secondary-color__3RLrb s_text-center__Zi9EM s_text_numbers__2nPsT EarnPage_hoverColor__14dYo"}">$0.00</span>
                <div class="${"EarnPage_EarnPage__table__sub__DRxXM"}"><div class="${"s_text__2O9ZL s_body3__3wlSS s_secondary-color__3RLrb s_text-center__Zi9EM s_text_numbers__2nPsT"}">$0.00</div></div></div>
             <div class="${"EarnPage_EarnPage__table__daily__3YLXd"}"><div class="${"s_text__2O9ZL s_small__2mNdX s_secondary-color__3RLrb"}">Daily</div>
                <span class="${"s_text__2O9ZL s_body3__3wlSS s_weight-semibold__2lhBJ s_secondary-color__3RLrb s_text_numbers__2nPsT EarnPage_hoverColor__14dYo"}">0.099 %</span></div>
             <div><div class="${"s_text__2O9ZL s_small__2mNdX s_secondary-color__3RLrb"}">APR</div>
                <span class="${"s_text__2O9ZL s_body3__3wlSS s_weight-semibold__2lhBJ s_primary-color__1S4LI s_text_numbers__2nPsT"}">30.784 %</span></div>
             <div class="${"EarnPage_EarnPage__table__earned__3ARHv"}"><div class="${"s_text__2O9ZL s_small__2mNdX s_secondary-color__3RLrb"}">Earned</div>
                <span class="${"s_text__2O9ZL s_body2__d8EpH s_weight-semibold__2lhBJ s_secondary-color__3RLrb s_text-center__Zi9EM s_text_numbers__2nPsT EarnPage_hoverColor__14dYo"}">$0.00</span></div>
             <div class="${"EarnPage_EarnPage__table__liquidity__1x_c2"}"><div class="${"s_text__2O9ZL s_small__2mNdX s_secondary-color__3RLrb"}">Liquidity</div>
                <span class="${"s_text__2O9ZL s_body3__3wlSS s_weight-semibold__2lhBJ s_secondary-color__3RLrb s_text_numbers__2nPsT EarnPage_hoverColor__14dYo"}">$955,655</span></div></div></div></div>
    <div class="${"ant-collapse-content ant-collapse-content-inactive ant-collapse-content-hidden"}" style="${""}"${add_attribute("this", id, 0)}><div class="${"ant-collapse-content-box"}"><div class="${"EarnPage_EarnPage__table__content__1JJ6f"}"><div class="${"EarnPage_EarnPage__table__content__nav__3Z8vO"}"><div class="${"EarnPage_EarnPage__table__content__links__1sViI"}"><div class="${"s_text__2O9ZL s_body2__d8EpH s_weight-bold__7n-86"}"><a href="${"https://app.apeswap.finance/swap?inputCurrency=0x64d3638a7d8747eee7bd5d402cc5f5bd00dc27dc&outputCurrency=0xe9e7cea3dedca5984780bafc599bd69add087d56"}" target="${"_blank"}" rel="${"noreferrer"}">Purchase ${escape(scritta)} <i class="${"icon icon-arrow-angle-right"}"></i></a></div>
                   <div class="${"s_text__2O9ZL s_body2__d8EpH s_weight-bold__7n-86"}"><a href="${"https://bscscan.com/address/0x7BcC195Ee4F1f8D739f0e234E0fcA886B62f67D5"}" target="${"_blank"}" rel="${"noreferrer"}">Vault Contract <i class="${"icon icon-arrow-angle-right"}"></i></a></div>
                   <div class="${"s_text__2O9ZL s_body2__d8EpH s_weight-bold__7n-86"}"><a href="${"https://bscscan.com/address/0xEE7Bc7727436D839634845766f567fa354ba8C56"}" target="${"_blank"}" rel="${"noreferrer"}">Farm Contract <i class="${"icon icon-arrow-angle-right"}"></i></a></div></div></div>
             <div class="${"EarnPage_EarnPage__table__content__forms__61FA5"}"><div class="${"swiper-container swiper-container-initialized swiper-container-horizontal swiper-container-pointer-events vaults-slider"}"><div class="${"container text-left"}"><div class="${"d-flex flex-sm-row flex-column"}"><div class="${"mr-auto p-2 font-bold text-xl"}" style="${"margin-right: 5px;"}"><form id="${"deposit"}" class="${"ant-form ant-form-horizontal earn__form"}"><div class="${"earn__form__item"}"><div class="${"ant-row ant-form-item"}" style="${"row-gap: 0px;"}"><div class="${"ant-col ant-form-item-label"}" style="${"margin-bottom: 10px;"}"><label for="${"deposit_depositAmount"}" class="${"ant-form-item-required ant-form-item-no-colon"}" title="${""}"><span title="${"Deposit Fee: 0%"}">Deposit: <span class="${"earn__form__item_amount"}">0.00000</span> ${escape(scritta)}</span></label></div>
                                  
                                       <div class="${"ant-col ant-form-item-control"}"><div class="${"ant-form-item-control-input"}"><div class="${"ant-form-item-control-input-content"}"><div class="${"ant-input-number inputButton"}"><div class="${"ant-input-number-handler-wrap"}"><span unselectable="${"on"}" role="${"button"}" aria-label="${"Increase Value"}" aria-disabled="${"false"}" class="${"ant-input-number-handler ant-input-number-handler-up"}"><span role="${"img"}" aria-label="${"up"}" class="${"anticon anticon-up ant-input-number-handler-up-inner"}"><svg viewBox="${"64 64 896 896"}" focusable="${"false"}" data-icon="${"up"}" width="${"1em"}" height="${"1em"}" fill="${"currentColor"}" aria-hidden="${"true"}"><path d="${"M890.5 755.3L537.9 269.2c-12.8-17.6-39-17.6-51.7 0L133.5 755.3A8 8 0 00140 768h75c5.1 0 9.9-2.5 12.9-6.6L512 369.8l284.1 391.6c3 4.1 7.8 6.6 12.9 6.6h75c6.5 0 10.3-7.4 6.5-12.7z"}"></path></svg></span></span>
                                                      <span unselectable="${"on"}" role="${"button"}" aria-label="${"Decrease Value"}" aria-disabled="${"false"}" class="${"ant-input-number-handler ant-input-number-handler-down"}"><span role="${"img"}" aria-label="${"down"}" class="${"anticon anticon-down ant-input-number-handler-down-inner"}"><svg viewBox="${"64 64 896 896"}" focusable="${"false"}" data-icon="${"down"}" width="${"1em"}" height="${"1em"}" fill="${"currentColor"}" aria-hidden="${"true"}"><path d="${"M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"}"></path></svg></span></span></div>
                                                   <div class="${"ant-input-number-input-wrap"}"><input autocomplete="${"off"}" role="${"spinbutton"}" aria-valuemin="${"0"}" aria-valuemax="${"0"}" step="${"1"}" placeholder="${"0"}" id="${"deposit_depositAmount"}" class="${"ant-input-number-input"}" value="${""}"></div></div></div></div></div></div></div>
                                 <div class="${"ant-row ant-form-item"}" style="${"row-gap: 0px;"}"><div class="${"ant-col ant-form-item-control"}"><div class="${"ant-form-item-control-input"}"><div class="${"ant-form-item-control-input-content"}"><button disabled="${""}" type="${"submit"}" class="${"ant-btn ant-btn-primary button-1"}"><span>Deposit</span></button></div></div></div></div>
                                 <div class="${"EarnPage_EarnPage__table__content__fee__3ttDn"}"><div class="${"s_text__2O9ZL s_small__2mNdX s_primary-color__1S4LI s_text-center__Zi9EM s_text_numbers__2nPsT"}">Deposit Fee: 0%</div></div></form></div>

                           <br>
                           <div class="${"p-2 font-bold text-xl"}" style="${"margin-right: 5px;"}"><form id="${"withdraw"}" class="${"ant-form ant-form-horizontal earn__form"}"><div class="${"earn__form__item"}"><div class="${"ant-row ant-form-item"}" style="${"row-gap: 0px;"}"><div class="${"ant-col ant-form-item-label"}" style="${"margin-bottom: 10px;"}"><label for="${"withdraw_withdrawAmount"}" class="${"ant-form-item-required ant-form-item-no-colon"}" title="${""}"><span title="${"Withdrawal Fee: 0%"}">Withdraw: <span class="${"earn__form__item_amount"}">0.00000</span> ${escape(scritta)}</span></label></div>
                                       
                                       <div class="${"ant-col ant-form-item-control"}"><div class="${"ant-form-item-control-input"}"><div class="${"ant-form-item-control-input-content"}"><div class="${"ant-input-number inputButton"}"><div class="${"ant-input-number-handler-wrap"}"><span unselectable="${"on"}" role="${"button"}" aria-label="${"Increase Value"}" aria-disabled="${"false"}" class="${"ant-input-number-handler ant-input-number-handler-up"}"><span role="${"img"}" aria-label="${"up"}" class="${"anticon anticon-up ant-input-number-handler-up-inner"}"><svg viewBox="${"64 64 896 896"}" focusable="${"false"}" data-icon="${"up"}" width="${"1em"}" height="${"1em"}" fill="${"currentColor"}" aria-hidden="${"true"}"><path d="${"M890.5 755.3L537.9 269.2c-12.8-17.6-39-17.6-51.7 0L133.5 755.3A8 8 0 00140 768h75c5.1 0 9.9-2.5 12.9-6.6L512 369.8l284.1 391.6c3 4.1 7.8 6.6 12.9 6.6h75c6.5 0 10.3-7.4 6.5-12.7z"}"></path></svg></span></span>
                                                      <span unselectable="${"on"}" role="${"button"}" aria-label="${"Decrease Value"}" aria-disabled="${"false"}" class="${"ant-input-number-handler ant-input-number-handler-down"}"><span role="${"img"}" aria-label="${"down"}" class="${"anticon anticon-down ant-input-number-handler-down-inner"}"><svg viewBox="${"64 64 896 896"}" focusable="${"false"}" data-icon="${"down"}" width="${"1em"}" height="${"1em"}" fill="${"currentColor"}" aria-hidden="${"true"}"><path d="${"M884 256h-75c-5.1 0-9.9 2.5-12.9 6.6L512 654.2 227.9 262.6c-3-4.1-7.8-6.6-12.9-6.6h-75c-6.5 0-10.3 7.4-6.5 12.7l352.6 486.1c12.8 17.6 39 17.6 51.7 0l352.6-486.1c3.9-5.3.1-12.7-6.4-12.7z"}"></path></svg></span></span></div>
                                                   <div class="${"ant-input-number-input-wrap"}"><input autocomplete="${"off"}" role="${"spinbutton"}" aria-valuemin="${"0"}" aria-valuemax="${"0"}" step="${"1"}" placeholder="${"0"}" id="${"withdraw_withdrawAmount"}" class="${"ant-input-number-input"}" value="${""}"></div></div></div></div></div></div></div>
                                 <div class="${"ant-row ant-form-item"}" style="${"row-gap: 0px;"}"><div class="${"ant-col ant-form-item-control"}"><div class="${"ant-form-item-control-input"}"><div class="${"ant-form-item-control-input-content"}"><button disabled="${""}" type="${"submit"}" class="${"ant-btn ant-btn-primary button-1"}"><span>Withdraw</span></button></div></div></div></div>
                                 <div class="${"EarnPage_EarnPage__table__content__fee__3ttDn"}"><div class="${"s_text__2O9ZL s_small__2mNdX s_primary-color__1S4LI s_text-center__Zi9EM s_text_numbers__2nPsT"}">Withdrawal Fee: 0%</div></div></form></div>

                           <br>
                           <div class="${"p-2 text-xl"}"><div class="${"EarnPage_EarnPage__table__content__controls__N7v8S"}"><span class="${"s_text__2O9ZL s_body1__1kjhf s_primary-color__1S4LI EarnPage_EarnPage__table__content__tooltip__2JsUz"}" style="${"margin-bottom: 10px;"}">sYSL Rewards</span>
                                 <br>
                                 
                                 <div class="${"EarnPage_EarnPage__table__content__rewards__uy9jP"}"><span class="${"s_text__2O9ZL s_h6__TYu-o s_weight-semibold__2lhBJ s_text-center__Zi9EM s_text_numbers__2nPsT"}">$0.00</span>
                                    <div class="${"s_text__2O9ZL s_small__2mNdX s_secondary-color__3RLrb s_text-center__Zi9EM s_text_numbers__2nPsT"}">0.00000</div></div>
                                 <button disabled="${""}" type="${"button"}" class="${"ant-btn button-1"}"><span>HARVEST</span></button>
                                 <div class="${"s_text__2O9ZL s_small__2mNdX s_primary-color__1S4LI s_text-center__Zi9EM s_text_numbers__2nPsT"}">Performance Fee: 0%</div></div></div></div></div></div></div></div></div></div></div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/tvl-b6726eb0.js
var tvl_b6726eb0_exports = {};
__export(tvl_b6726eb0_exports, {
  default: () => Tvl
});
var css2, Tvl;
var init_tvl_b6726eb0 = __esm({
  ".svelte-kit/output/server/chunks/tvl-b6726eb0.js"() {
    init_shims();
    init_app_171d3477();
    css2 = {
      code: ".tvl.svelte-1bwosjg{width:50%}@media screen and (max-width: 640px){.tvl.svelte-1bwosjg{width:100%}}",
      map: null
    };
    Tvl = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      $$result.css.add(css2);
      return `

<div class="${"PriceTiles_PriceTiles__list__duygP"}" style="${"padding: 0px 0px 50px 0px"}"><div class="${"swiper-container swiper-container-initialized swiper-container-horizontal swiper-container-pointer-events"}" style="${"cursor: grab;"}"><div class="${"PriceTiles_PriceTiles__8qvTB tvl svelte-1bwosjg"}" style="${"margin: auto; text-align: center;"}"><ul class="${"PriceTiles_PriceTiles__list__duygP"}"><li class="${"PriceTiles_PriceTiles__tile__3HGxJ"}"><div class="${"ant-row ant-row-space-between"}" style="${"row-gap: 0px;"}"><div class="${"PriceTiles_PriceTiles__tile__card__2XaWg"}"><div class="${"s_text__2O9ZL s_h3__2BUPD s_weight-bold__7n-86 s_primary-color__1S4LI s_text_numbers__2nPsT PriceTiles_PriceTiles__tile__amount__1ityA Gradient-text"}" style="${"margin-right: 10px;"}">$2,544,422</div><div class="${"PriceTiles_PriceTiles__tile__title__2Ab3H"}"><div class="${"s_text__2O9ZL s_body3__3wlSS s_secondary-color__3RLrb"}">Total Value Locked</div></div></div></div></li></ul></div>
  
    <div class="${"swiper-pagination"}"></div></div>
</div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/banner-f9439a17.js
var banner_f9439a17_exports = {};
__export(banner_f9439a17_exports, {
  default: () => Banner
});
function isObject$2(obj) {
  return obj !== null && typeof obj === "object" && "constructor" in obj && obj.constructor === Object;
}
function extend$2(target = {}, src2 = {}) {
  Object.keys(src2).forEach((key) => {
    if (typeof target[key] === "undefined")
      target[key] = src2[key];
    else if (isObject$2(src2[key]) && isObject$2(target[key]) && Object.keys(src2[key]).length > 0) {
      extend$2(target[key], src2[key]);
    }
  });
}
function getDocument() {
  const doc = typeof document !== "undefined" ? document : {};
  extend$2(doc, ssrDocument);
  return doc;
}
function getWindow() {
  const win = typeof window !== "undefined" ? window : {};
  extend$2(win, ssrWindow);
  return win;
}
function makeReactive(obj) {
  const proto = obj.__proto__;
  Object.defineProperty(obj, "__proto__", {
    get() {
      return proto;
    },
    set(value) {
      proto.__proto__ = value;
    }
  });
}
function arrayFlat(arr = []) {
  const res = [];
  arr.forEach((el) => {
    if (Array.isArray(el)) {
      res.push(...arrayFlat(el));
    } else {
      res.push(el);
    }
  });
  return res;
}
function arrayFilter(arr, callback) {
  return Array.prototype.filter.call(arr, callback);
}
function arrayUnique(arr) {
  const uniqueArray = [];
  for (let i = 0; i < arr.length; i += 1) {
    if (uniqueArray.indexOf(arr[i]) === -1)
      uniqueArray.push(arr[i]);
  }
  return uniqueArray;
}
function qsa(selector, context) {
  if (typeof selector !== "string") {
    return [selector];
  }
  const a = [];
  const res = context.querySelectorAll(selector);
  for (let i = 0; i < res.length; i += 1) {
    a.push(res[i]);
  }
  return a;
}
function $(selector, context) {
  const window2 = getWindow();
  const document2 = getDocument();
  let arr = [];
  if (!context && selector instanceof Dom7) {
    return selector;
  }
  if (!selector) {
    return new Dom7(arr);
  }
  if (typeof selector === "string") {
    const html2 = selector.trim();
    if (html2.indexOf("<") >= 0 && html2.indexOf(">") >= 0) {
      let toCreate = "div";
      if (html2.indexOf("<li") === 0)
        toCreate = "ul";
      if (html2.indexOf("<tr") === 0)
        toCreate = "tbody";
      if (html2.indexOf("<td") === 0 || html2.indexOf("<th") === 0)
        toCreate = "tr";
      if (html2.indexOf("<tbody") === 0)
        toCreate = "table";
      if (html2.indexOf("<option") === 0)
        toCreate = "select";
      const tempParent = document2.createElement(toCreate);
      tempParent.innerHTML = html2;
      for (let i = 0; i < tempParent.childNodes.length; i += 1) {
        arr.push(tempParent.childNodes[i]);
      }
    } else {
      arr = qsa(selector.trim(), context || document2);
    }
  } else if (selector.nodeType || selector === window2 || selector === document2) {
    arr.push(selector);
  } else if (Array.isArray(selector)) {
    if (selector instanceof Dom7)
      return selector;
    arr = selector;
  }
  return new Dom7(arrayUnique(arr));
}
function addClass(...classes2) {
  const classNames = arrayFlat(classes2.map((c) => c.split(" ")));
  this.forEach((el) => {
    el.classList.add(...classNames);
  });
  return this;
}
function removeClass(...classes2) {
  const classNames = arrayFlat(classes2.map((c) => c.split(" ")));
  this.forEach((el) => {
    el.classList.remove(...classNames);
  });
  return this;
}
function toggleClass(...classes2) {
  const classNames = arrayFlat(classes2.map((c) => c.split(" ")));
  this.forEach((el) => {
    classNames.forEach((className) => {
      el.classList.toggle(className);
    });
  });
}
function hasClass(...classes2) {
  const classNames = arrayFlat(classes2.map((c) => c.split(" ")));
  return arrayFilter(this, (el) => {
    return classNames.filter((className) => el.classList.contains(className)).length > 0;
  }).length > 0;
}
function attr(attrs, value) {
  if (arguments.length === 1 && typeof attrs === "string") {
    if (this[0])
      return this[0].getAttribute(attrs);
    return void 0;
  }
  for (let i = 0; i < this.length; i += 1) {
    if (arguments.length === 2) {
      this[i].setAttribute(attrs, value);
    } else {
      for (const attrName in attrs) {
        this[i][attrName] = attrs[attrName];
        this[i].setAttribute(attrName, attrs[attrName]);
      }
    }
  }
  return this;
}
function removeAttr(attr2) {
  for (let i = 0; i < this.length; i += 1) {
    this[i].removeAttribute(attr2);
  }
  return this;
}
function transform(transform2) {
  for (let i = 0; i < this.length; i += 1) {
    this[i].style.transform = transform2;
  }
  return this;
}
function transition$1(duration) {
  for (let i = 0; i < this.length; i += 1) {
    this[i].style.transitionDuration = typeof duration !== "string" ? `${duration}ms` : duration;
  }
  return this;
}
function on(...args) {
  let [eventType, targetSelector, listener, capture] = args;
  if (typeof args[1] === "function") {
    [eventType, listener, capture] = args;
    targetSelector = void 0;
  }
  if (!capture)
    capture = false;
  function handleLiveEvent(e) {
    const target = e.target;
    if (!target)
      return;
    const eventData = e.target.dom7EventData || [];
    if (eventData.indexOf(e) < 0) {
      eventData.unshift(e);
    }
    if ($(target).is(targetSelector))
      listener.apply(target, eventData);
    else {
      const parents2 = $(target).parents();
      for (let k = 0; k < parents2.length; k += 1) {
        if ($(parents2[k]).is(targetSelector))
          listener.apply(parents2[k], eventData);
      }
    }
  }
  function handleEvent(e) {
    const eventData = e && e.target ? e.target.dom7EventData || [] : [];
    if (eventData.indexOf(e) < 0) {
      eventData.unshift(e);
    }
    listener.apply(this, eventData);
  }
  const events2 = eventType.split(" ");
  let j;
  for (let i = 0; i < this.length; i += 1) {
    const el = this[i];
    if (!targetSelector) {
      for (j = 0; j < events2.length; j += 1) {
        const event = events2[j];
        if (!el.dom7Listeners)
          el.dom7Listeners = {};
        if (!el.dom7Listeners[event])
          el.dom7Listeners[event] = [];
        el.dom7Listeners[event].push({
          listener,
          proxyListener: handleEvent
        });
        el.addEventListener(event, handleEvent, capture);
      }
    } else {
      for (j = 0; j < events2.length; j += 1) {
        const event = events2[j];
        if (!el.dom7LiveListeners)
          el.dom7LiveListeners = {};
        if (!el.dom7LiveListeners[event])
          el.dom7LiveListeners[event] = [];
        el.dom7LiveListeners[event].push({
          listener,
          proxyListener: handleLiveEvent
        });
        el.addEventListener(event, handleLiveEvent, capture);
      }
    }
  }
  return this;
}
function off(...args) {
  let [eventType, targetSelector, listener, capture] = args;
  if (typeof args[1] === "function") {
    [eventType, listener, capture] = args;
    targetSelector = void 0;
  }
  if (!capture)
    capture = false;
  const events2 = eventType.split(" ");
  for (let i = 0; i < events2.length; i += 1) {
    const event = events2[i];
    for (let j = 0; j < this.length; j += 1) {
      const el = this[j];
      let handlers;
      if (!targetSelector && el.dom7Listeners) {
        handlers = el.dom7Listeners[event];
      } else if (targetSelector && el.dom7LiveListeners) {
        handlers = el.dom7LiveListeners[event];
      }
      if (handlers && handlers.length) {
        for (let k = handlers.length - 1; k >= 0; k -= 1) {
          const handler = handlers[k];
          if (listener && handler.listener === listener) {
            el.removeEventListener(event, handler.proxyListener, capture);
            handlers.splice(k, 1);
          } else if (listener && handler.listener && handler.listener.dom7proxy && handler.listener.dom7proxy === listener) {
            el.removeEventListener(event, handler.proxyListener, capture);
            handlers.splice(k, 1);
          } else if (!listener) {
            el.removeEventListener(event, handler.proxyListener, capture);
            handlers.splice(k, 1);
          }
        }
      }
    }
  }
  return this;
}
function trigger(...args) {
  const window2 = getWindow();
  const events2 = args[0].split(" ");
  const eventData = args[1];
  for (let i = 0; i < events2.length; i += 1) {
    const event = events2[i];
    for (let j = 0; j < this.length; j += 1) {
      const el = this[j];
      if (window2.CustomEvent) {
        const evt = new window2.CustomEvent(event, {
          detail: eventData,
          bubbles: true,
          cancelable: true
        });
        el.dom7EventData = args.filter((data, dataIndex) => dataIndex > 0);
        el.dispatchEvent(evt);
        el.dom7EventData = [];
        delete el.dom7EventData;
      }
    }
  }
  return this;
}
function transitionEnd$1(callback) {
  const dom = this;
  function fireCallBack(e) {
    if (e.target !== this)
      return;
    callback.call(this, e);
    dom.off("transitionend", fireCallBack);
  }
  if (callback) {
    dom.on("transitionend", fireCallBack);
  }
  return this;
}
function outerWidth(includeMargins) {
  if (this.length > 0) {
    if (includeMargins) {
      const styles2 = this.styles();
      return this[0].offsetWidth + parseFloat(styles2.getPropertyValue("margin-right")) + parseFloat(styles2.getPropertyValue("margin-left"));
    }
    return this[0].offsetWidth;
  }
  return null;
}
function outerHeight(includeMargins) {
  if (this.length > 0) {
    if (includeMargins) {
      const styles2 = this.styles();
      return this[0].offsetHeight + parseFloat(styles2.getPropertyValue("margin-top")) + parseFloat(styles2.getPropertyValue("margin-bottom"));
    }
    return this[0].offsetHeight;
  }
  return null;
}
function offset() {
  if (this.length > 0) {
    const window2 = getWindow();
    const document2 = getDocument();
    const el = this[0];
    const box = el.getBoundingClientRect();
    const body = document2.body;
    const clientTop = el.clientTop || body.clientTop || 0;
    const clientLeft = el.clientLeft || body.clientLeft || 0;
    const scrollTop = el === window2 ? window2.scrollY : el.scrollTop;
    const scrollLeft = el === window2 ? window2.scrollX : el.scrollLeft;
    return {
      top: box.top + scrollTop - clientTop,
      left: box.left + scrollLeft - clientLeft
    };
  }
  return null;
}
function styles() {
  const window2 = getWindow();
  if (this[0])
    return window2.getComputedStyle(this[0], null);
  return {};
}
function css3(props, value) {
  const window2 = getWindow();
  let i;
  if (arguments.length === 1) {
    if (typeof props === "string") {
      if (this[0])
        return window2.getComputedStyle(this[0], null).getPropertyValue(props);
    } else {
      for (i = 0; i < this.length; i += 1) {
        for (const prop in props) {
          this[i].style[prop] = props[prop];
        }
      }
      return this;
    }
  }
  if (arguments.length === 2 && typeof props === "string") {
    for (i = 0; i < this.length; i += 1) {
      this[i].style[props] = value;
    }
    return this;
  }
  return this;
}
function each(callback) {
  if (!callback)
    return this;
  this.forEach((el, index2) => {
    callback.apply(el, [el, index2]);
  });
  return this;
}
function filter(callback) {
  const result = arrayFilter(this, callback);
  return $(result);
}
function html(html2) {
  if (typeof html2 === "undefined") {
    return this[0] ? this[0].innerHTML : null;
  }
  for (let i = 0; i < this.length; i += 1) {
    this[i].innerHTML = html2;
  }
  return this;
}
function text(text2) {
  if (typeof text2 === "undefined") {
    return this[0] ? this[0].textContent.trim() : null;
  }
  for (let i = 0; i < this.length; i += 1) {
    this[i].textContent = text2;
  }
  return this;
}
function is(selector) {
  const window2 = getWindow();
  const document2 = getDocument();
  const el = this[0];
  let compareWith;
  let i;
  if (!el || typeof selector === "undefined")
    return false;
  if (typeof selector === "string") {
    if (el.matches)
      return el.matches(selector);
    if (el.webkitMatchesSelector)
      return el.webkitMatchesSelector(selector);
    if (el.msMatchesSelector)
      return el.msMatchesSelector(selector);
    compareWith = $(selector);
    for (i = 0; i < compareWith.length; i += 1) {
      if (compareWith[i] === el)
        return true;
    }
    return false;
  }
  if (selector === document2) {
    return el === document2;
  }
  if (selector === window2) {
    return el === window2;
  }
  if (selector.nodeType || selector instanceof Dom7) {
    compareWith = selector.nodeType ? [selector] : selector;
    for (i = 0; i < compareWith.length; i += 1) {
      if (compareWith[i] === el)
        return true;
    }
    return false;
  }
  return false;
}
function index() {
  let child = this[0];
  let i;
  if (child) {
    i = 0;
    while ((child = child.previousSibling) !== null) {
      if (child.nodeType === 1)
        i += 1;
    }
    return i;
  }
  return void 0;
}
function eq(index2) {
  if (typeof index2 === "undefined")
    return this;
  const length = this.length;
  if (index2 > length - 1) {
    return $([]);
  }
  if (index2 < 0) {
    const returnIndex = length + index2;
    if (returnIndex < 0)
      return $([]);
    return $([this[returnIndex]]);
  }
  return $([this[index2]]);
}
function append(...els) {
  let newChild;
  const document2 = getDocument();
  for (let k = 0; k < els.length; k += 1) {
    newChild = els[k];
    for (let i = 0; i < this.length; i += 1) {
      if (typeof newChild === "string") {
        const tempDiv = document2.createElement("div");
        tempDiv.innerHTML = newChild;
        while (tempDiv.firstChild) {
          this[i].appendChild(tempDiv.firstChild);
        }
      } else if (newChild instanceof Dom7) {
        for (let j = 0; j < newChild.length; j += 1) {
          this[i].appendChild(newChild[j]);
        }
      } else {
        this[i].appendChild(newChild);
      }
    }
  }
  return this;
}
function prepend(newChild) {
  const document2 = getDocument();
  let i;
  let j;
  for (i = 0; i < this.length; i += 1) {
    if (typeof newChild === "string") {
      const tempDiv = document2.createElement("div");
      tempDiv.innerHTML = newChild;
      for (j = tempDiv.childNodes.length - 1; j >= 0; j -= 1) {
        this[i].insertBefore(tempDiv.childNodes[j], this[i].childNodes[0]);
      }
    } else if (newChild instanceof Dom7) {
      for (j = 0; j < newChild.length; j += 1) {
        this[i].insertBefore(newChild[j], this[i].childNodes[0]);
      }
    } else {
      this[i].insertBefore(newChild, this[i].childNodes[0]);
    }
  }
  return this;
}
function next(selector) {
  if (this.length > 0) {
    if (selector) {
      if (this[0].nextElementSibling && $(this[0].nextElementSibling).is(selector)) {
        return $([this[0].nextElementSibling]);
      }
      return $([]);
    }
    if (this[0].nextElementSibling)
      return $([this[0].nextElementSibling]);
    return $([]);
  }
  return $([]);
}
function nextAll(selector) {
  const nextEls = [];
  let el = this[0];
  if (!el)
    return $([]);
  while (el.nextElementSibling) {
    const next2 = el.nextElementSibling;
    if (selector) {
      if ($(next2).is(selector))
        nextEls.push(next2);
    } else
      nextEls.push(next2);
    el = next2;
  }
  return $(nextEls);
}
function prev(selector) {
  if (this.length > 0) {
    const el = this[0];
    if (selector) {
      if (el.previousElementSibling && $(el.previousElementSibling).is(selector)) {
        return $([el.previousElementSibling]);
      }
      return $([]);
    }
    if (el.previousElementSibling)
      return $([el.previousElementSibling]);
    return $([]);
  }
  return $([]);
}
function prevAll(selector) {
  const prevEls = [];
  let el = this[0];
  if (!el)
    return $([]);
  while (el.previousElementSibling) {
    const prev2 = el.previousElementSibling;
    if (selector) {
      if ($(prev2).is(selector))
        prevEls.push(prev2);
    } else
      prevEls.push(prev2);
    el = prev2;
  }
  return $(prevEls);
}
function parent(selector) {
  const parents2 = [];
  for (let i = 0; i < this.length; i += 1) {
    if (this[i].parentNode !== null) {
      if (selector) {
        if ($(this[i].parentNode).is(selector))
          parents2.push(this[i].parentNode);
      } else {
        parents2.push(this[i].parentNode);
      }
    }
  }
  return $(parents2);
}
function parents(selector) {
  const parents2 = [];
  for (let i = 0; i < this.length; i += 1) {
    let parent2 = this[i].parentNode;
    while (parent2) {
      if (selector) {
        if ($(parent2).is(selector))
          parents2.push(parent2);
      } else {
        parents2.push(parent2);
      }
      parent2 = parent2.parentNode;
    }
  }
  return $(parents2);
}
function closest(selector) {
  let closest2 = this;
  if (typeof selector === "undefined") {
    return $([]);
  }
  if (!closest2.is(selector)) {
    closest2 = closest2.parents(selector).eq(0);
  }
  return closest2;
}
function find(selector) {
  const foundElements = [];
  for (let i = 0; i < this.length; i += 1) {
    const found = this[i].querySelectorAll(selector);
    for (let j = 0; j < found.length; j += 1) {
      foundElements.push(found[j]);
    }
  }
  return $(foundElements);
}
function children(selector) {
  const children2 = [];
  for (let i = 0; i < this.length; i += 1) {
    const childNodes = this[i].children;
    for (let j = 0; j < childNodes.length; j += 1) {
      if (!selector || $(childNodes[j]).is(selector)) {
        children2.push(childNodes[j]);
      }
    }
  }
  return $(children2);
}
function remove() {
  for (let i = 0; i < this.length; i += 1) {
    if (this[i].parentNode)
      this[i].parentNode.removeChild(this[i]);
  }
  return this;
}
function deleteProps(obj) {
  const object = obj;
  Object.keys(object).forEach((key) => {
    try {
      object[key] = null;
    } catch (e) {
    }
    try {
      delete object[key];
    } catch (e) {
    }
  });
}
function nextTick(callback, delay = 0) {
  return setTimeout(callback, delay);
}
function now() {
  return Date.now();
}
function getComputedStyle$1(el) {
  const window2 = getWindow();
  let style;
  if (window2.getComputedStyle) {
    style = window2.getComputedStyle(el, null);
  }
  if (!style && el.currentStyle) {
    style = el.currentStyle;
  }
  if (!style) {
    style = el.style;
  }
  return style;
}
function getTranslate(el, axis = "x") {
  const window2 = getWindow();
  let matrix;
  let curTransform;
  let transformMatrix;
  const curStyle = getComputedStyle$1(el);
  if (window2.WebKitCSSMatrix) {
    curTransform = curStyle.transform || curStyle.webkitTransform;
    if (curTransform.split(",").length > 6) {
      curTransform = curTransform.split(", ").map((a) => a.replace(",", ".")).join(", ");
    }
    transformMatrix = new window2.WebKitCSSMatrix(curTransform === "none" ? "" : curTransform);
  } else {
    transformMatrix = curStyle.MozTransform || curStyle.OTransform || curStyle.MsTransform || curStyle.msTransform || curStyle.transform || curStyle.getPropertyValue("transform").replace("translate(", "matrix(1, 0, 0, 1,");
    matrix = transformMatrix.toString().split(",");
  }
  if (axis === "x") {
    if (window2.WebKitCSSMatrix)
      curTransform = transformMatrix.m41;
    else if (matrix.length === 16)
      curTransform = parseFloat(matrix[12]);
    else
      curTransform = parseFloat(matrix[4]);
  }
  if (axis === "y") {
    if (window2.WebKitCSSMatrix)
      curTransform = transformMatrix.m42;
    else if (matrix.length === 16)
      curTransform = parseFloat(matrix[13]);
    else
      curTransform = parseFloat(matrix[5]);
  }
  return curTransform || 0;
}
function isObject$1(o) {
  return typeof o === "object" && o !== null && o.constructor && Object.prototype.toString.call(o).slice(8, -1) === "Object";
}
function isNode(node) {
  if (typeof window !== "undefined" && typeof window.HTMLElement !== "undefined") {
    return node instanceof HTMLElement;
  }
  return node && (node.nodeType === 1 || node.nodeType === 11);
}
function extend$1(...args) {
  const to = Object(args[0]);
  const noExtend = ["__proto__", "constructor", "prototype"];
  for (let i = 1; i < args.length; i += 1) {
    const nextSource = args[i];
    if (nextSource !== void 0 && nextSource !== null && !isNode(nextSource)) {
      const keysArray = Object.keys(Object(nextSource)).filter((key) => noExtend.indexOf(key) < 0);
      for (let nextIndex = 0, len = keysArray.length; nextIndex < len; nextIndex += 1) {
        const nextKey = keysArray[nextIndex];
        const desc = Object.getOwnPropertyDescriptor(nextSource, nextKey);
        if (desc !== void 0 && desc.enumerable) {
          if (isObject$1(to[nextKey]) && isObject$1(nextSource[nextKey])) {
            if (nextSource[nextKey].__swiper__) {
              to[nextKey] = nextSource[nextKey];
            } else {
              extend$1(to[nextKey], nextSource[nextKey]);
            }
          } else if (!isObject$1(to[nextKey]) && isObject$1(nextSource[nextKey])) {
            to[nextKey] = {};
            if (nextSource[nextKey].__swiper__) {
              to[nextKey] = nextSource[nextKey];
            } else {
              extend$1(to[nextKey], nextSource[nextKey]);
            }
          } else {
            to[nextKey] = nextSource[nextKey];
          }
        }
      }
    }
  }
  return to;
}
function setCSSProperty(el, varName, varValue) {
  el.style.setProperty(varName, varValue);
}
function animateCSSModeScroll({
  swiper,
  targetPosition,
  side
}) {
  const window2 = getWindow();
  const startPosition = -swiper.translate;
  let startTime = null;
  let time;
  const duration = swiper.params.speed;
  swiper.wrapperEl.style.scrollSnapType = "none";
  window2.cancelAnimationFrame(swiper.cssModeFrameID);
  const dir = targetPosition > startPosition ? "next" : "prev";
  const isOutOfBound = (current, target) => {
    return dir === "next" && current >= target || dir === "prev" && current <= target;
  };
  const animate = () => {
    time = new Date().getTime();
    if (startTime === null) {
      startTime = time;
    }
    const progress = Math.max(Math.min((time - startTime) / duration, 1), 0);
    const easeProgress = 0.5 - Math.cos(progress * Math.PI) / 2;
    let currentPosition = startPosition + easeProgress * (targetPosition - startPosition);
    if (isOutOfBound(currentPosition, targetPosition)) {
      currentPosition = targetPosition;
    }
    swiper.wrapperEl.scrollTo({
      [side]: currentPosition
    });
    if (isOutOfBound(currentPosition, targetPosition)) {
      swiper.wrapperEl.style.overflow = "hidden";
      swiper.wrapperEl.style.scrollSnapType = "";
      setTimeout(() => {
        swiper.wrapperEl.style.overflow = "";
        swiper.wrapperEl.scrollTo({
          [side]: currentPosition
        });
      });
      window2.cancelAnimationFrame(swiper.cssModeFrameID);
      return;
    }
    swiper.cssModeFrameID = window2.requestAnimationFrame(animate);
  };
  animate();
}
function calcSupport() {
  const window2 = getWindow();
  const document2 = getDocument();
  return {
    smoothScroll: document2.documentElement && "scrollBehavior" in document2.documentElement.style,
    touch: !!("ontouchstart" in window2 || window2.DocumentTouch && document2 instanceof window2.DocumentTouch),
    passiveListener: function checkPassiveListener() {
      let supportsPassive = false;
      try {
        const opts = Object.defineProperty({}, "passive", {
          get() {
            supportsPassive = true;
          }
        });
        window2.addEventListener("testPassiveListener", null, opts);
      } catch (e) {
      }
      return supportsPassive;
    }(),
    gestures: function checkGestures() {
      return "ongesturestart" in window2;
    }()
  };
}
function getSupport() {
  if (!support) {
    support = calcSupport();
  }
  return support;
}
function calcDevice({
  userAgent
} = {}) {
  const support2 = getSupport();
  const window2 = getWindow();
  const platform = window2.navigator.platform;
  const ua = userAgent || window2.navigator.userAgent;
  const device = {
    ios: false,
    android: false
  };
  const screenWidth = window2.screen.width;
  const screenHeight = window2.screen.height;
  const android = ua.match(/(Android);?[\s\/]+([\d.]+)?/);
  let ipad = ua.match(/(iPad).*OS\s([\d_]+)/);
  const ipod = ua.match(/(iPod)(.*OS\s([\d_]+))?/);
  const iphone = !ipad && ua.match(/(iPhone\sOS|iOS)\s([\d_]+)/);
  const windows = platform === "Win32";
  let macos = platform === "MacIntel";
  const iPadScreens = ["1024x1366", "1366x1024", "834x1194", "1194x834", "834x1112", "1112x834", "768x1024", "1024x768", "820x1180", "1180x820", "810x1080", "1080x810"];
  if (!ipad && macos && support2.touch && iPadScreens.indexOf(`${screenWidth}x${screenHeight}`) >= 0) {
    ipad = ua.match(/(Version)\/([\d.]+)/);
    if (!ipad)
      ipad = [0, 1, "13_0_0"];
    macos = false;
  }
  if (android && !windows) {
    device.os = "android";
    device.android = true;
  }
  if (ipad || iphone || ipod) {
    device.os = "ios";
    device.ios = true;
  }
  return device;
}
function getDevice(overrides = {}) {
  if (!deviceCached) {
    deviceCached = calcDevice(overrides);
  }
  return deviceCached;
}
function calcBrowser() {
  const window2 = getWindow();
  function isSafari() {
    const ua = window2.navigator.userAgent.toLowerCase();
    return ua.indexOf("safari") >= 0 && ua.indexOf("chrome") < 0 && ua.indexOf("android") < 0;
  }
  return {
    isSafari: isSafari(),
    isWebView: /(iPhone|iPod|iPad).*AppleWebKit(?!.*Safari)/i.test(window2.navigator.userAgent)
  };
}
function getBrowser() {
  if (!browser) {
    browser = calcBrowser();
  }
  return browser;
}
function Resize({
  swiper,
  on: on2,
  emit
}) {
  const window2 = getWindow();
  let observer = null;
  const resizeHandler = () => {
    if (!swiper || swiper.destroyed || !swiper.initialized)
      return;
    emit("beforeResize");
    emit("resize");
  };
  const createObserver = () => {
    if (!swiper || swiper.destroyed || !swiper.initialized)
      return;
    observer = new ResizeObserver((entries) => {
      const {
        width,
        height
      } = swiper;
      let newWidth = width;
      let newHeight = height;
      entries.forEach(({
        contentBoxSize,
        contentRect,
        target
      }) => {
        if (target && target !== swiper.el)
          return;
        newWidth = contentRect ? contentRect.width : (contentBoxSize[0] || contentBoxSize).inlineSize;
        newHeight = contentRect ? contentRect.height : (contentBoxSize[0] || contentBoxSize).blockSize;
      });
      if (newWidth !== width || newHeight !== height) {
        resizeHandler();
      }
    });
    observer.observe(swiper.el);
  };
  const removeObserver = () => {
    if (observer && observer.unobserve && swiper.el) {
      observer.unobserve(swiper.el);
      observer = null;
    }
  };
  const orientationChangeHandler = () => {
    if (!swiper || swiper.destroyed || !swiper.initialized)
      return;
    emit("orientationchange");
  };
  on2("init", () => {
    if (swiper.params.resizeObserver && typeof window2.ResizeObserver !== "undefined") {
      createObserver();
      return;
    }
    window2.addEventListener("resize", resizeHandler);
    window2.addEventListener("orientationchange", orientationChangeHandler);
  });
  on2("destroy", () => {
    removeObserver();
    window2.removeEventListener("resize", resizeHandler);
    window2.removeEventListener("orientationchange", orientationChangeHandler);
  });
}
function Observer({
  swiper,
  extendParams,
  on: on2,
  emit
}) {
  const observers = [];
  const window2 = getWindow();
  const attach = (target, options2 = {}) => {
    const ObserverFunc = window2.MutationObserver || window2.WebkitMutationObserver;
    const observer = new ObserverFunc((mutations) => {
      if (mutations.length === 1) {
        emit("observerUpdate", mutations[0]);
        return;
      }
      const observerUpdate = function observerUpdate2() {
        emit("observerUpdate", mutations[0]);
      };
      if (window2.requestAnimationFrame) {
        window2.requestAnimationFrame(observerUpdate);
      } else {
        window2.setTimeout(observerUpdate, 0);
      }
    });
    observer.observe(target, {
      attributes: typeof options2.attributes === "undefined" ? true : options2.attributes,
      childList: typeof options2.childList === "undefined" ? true : options2.childList,
      characterData: typeof options2.characterData === "undefined" ? true : options2.characterData
    });
    observers.push(observer);
  };
  const init2 = () => {
    if (!swiper.params.observer)
      return;
    if (swiper.params.observeParents) {
      const containerParents = swiper.$el.parents();
      for (let i = 0; i < containerParents.length; i += 1) {
        attach(containerParents[i]);
      }
    }
    attach(swiper.$el[0], {
      childList: swiper.params.observeSlideChildren
    });
    attach(swiper.$wrapperEl[0], {
      attributes: false
    });
  };
  const destroy = () => {
    observers.forEach((observer) => {
      observer.disconnect();
    });
    observers.splice(0, observers.length);
  };
  extendParams({
    observer: false,
    observeParents: false,
    observeSlideChildren: false
  });
  on2("init", init2);
  on2("destroy", destroy);
}
function updateSize() {
  const swiper = this;
  let width;
  let height;
  const $el = swiper.$el;
  if (typeof swiper.params.width !== "undefined" && swiper.params.width !== null) {
    width = swiper.params.width;
  } else {
    width = $el[0].clientWidth;
  }
  if (typeof swiper.params.height !== "undefined" && swiper.params.height !== null) {
    height = swiper.params.height;
  } else {
    height = $el[0].clientHeight;
  }
  if (width === 0 && swiper.isHorizontal() || height === 0 && swiper.isVertical()) {
    return;
  }
  width = width - parseInt($el.css("padding-left") || 0, 10) - parseInt($el.css("padding-right") || 0, 10);
  height = height - parseInt($el.css("padding-top") || 0, 10) - parseInt($el.css("padding-bottom") || 0, 10);
  if (Number.isNaN(width))
    width = 0;
  if (Number.isNaN(height))
    height = 0;
  Object.assign(swiper, {
    width,
    height,
    size: swiper.isHorizontal() ? width : height
  });
}
function updateSlides() {
  const swiper = this;
  function getDirectionLabel(property) {
    if (swiper.isHorizontal()) {
      return property;
    }
    return {
      "width": "height",
      "margin-top": "margin-left",
      "margin-bottom ": "margin-right",
      "margin-left": "margin-top",
      "margin-right": "margin-bottom",
      "padding-left": "padding-top",
      "padding-right": "padding-bottom",
      "marginRight": "marginBottom"
    }[property];
  }
  function getDirectionPropertyValue(node, label) {
    return parseFloat(node.getPropertyValue(getDirectionLabel(label)) || 0);
  }
  const params = swiper.params;
  const {
    $wrapperEl,
    size: swiperSize,
    rtlTranslate: rtl,
    wrongRTL
  } = swiper;
  const isVirtual = swiper.virtual && params.virtual.enabled;
  const previousSlidesLength = isVirtual ? swiper.virtual.slides.length : swiper.slides.length;
  const slides = $wrapperEl.children(`.${swiper.params.slideClass}`);
  const slidesLength = isVirtual ? swiper.virtual.slides.length : slides.length;
  let snapGrid = [];
  const slidesGrid = [];
  const slidesSizesGrid = [];
  let offsetBefore = params.slidesOffsetBefore;
  if (typeof offsetBefore === "function") {
    offsetBefore = params.slidesOffsetBefore.call(swiper);
  }
  let offsetAfter = params.slidesOffsetAfter;
  if (typeof offsetAfter === "function") {
    offsetAfter = params.slidesOffsetAfter.call(swiper);
  }
  const previousSnapGridLength = swiper.snapGrid.length;
  const previousSlidesGridLength = swiper.slidesGrid.length;
  let spaceBetween = params.spaceBetween;
  let slidePosition = -offsetBefore;
  let prevSlideSize = 0;
  let index2 = 0;
  if (typeof swiperSize === "undefined") {
    return;
  }
  if (typeof spaceBetween === "string" && spaceBetween.indexOf("%") >= 0) {
    spaceBetween = parseFloat(spaceBetween.replace("%", "")) / 100 * swiperSize;
  }
  swiper.virtualSize = -spaceBetween;
  if (rtl)
    slides.css({
      marginLeft: "",
      marginBottom: "",
      marginTop: ""
    });
  else
    slides.css({
      marginRight: "",
      marginBottom: "",
      marginTop: ""
    });
  if (params.centeredSlides && params.cssMode) {
    setCSSProperty(swiper.wrapperEl, "--swiper-centered-offset-before", "");
    setCSSProperty(swiper.wrapperEl, "--swiper-centered-offset-after", "");
  }
  const gridEnabled = params.grid && params.grid.rows > 1 && swiper.grid;
  if (gridEnabled) {
    swiper.grid.initSlides(slidesLength);
  }
  let slideSize;
  const shouldResetSlideSize = params.slidesPerView === "auto" && params.breakpoints && Object.keys(params.breakpoints).filter((key) => {
    return typeof params.breakpoints[key].slidesPerView !== "undefined";
  }).length > 0;
  for (let i = 0; i < slidesLength; i += 1) {
    slideSize = 0;
    const slide2 = slides.eq(i);
    if (gridEnabled) {
      swiper.grid.updateSlide(i, slide2, slidesLength, getDirectionLabel);
    }
    if (slide2.css("display") === "none")
      continue;
    if (params.slidesPerView === "auto") {
      if (shouldResetSlideSize) {
        slides[i].style[getDirectionLabel("width")] = ``;
      }
      const slideStyles = getComputedStyle(slide2[0]);
      const currentTransform = slide2[0].style.transform;
      const currentWebKitTransform = slide2[0].style.webkitTransform;
      if (currentTransform) {
        slide2[0].style.transform = "none";
      }
      if (currentWebKitTransform) {
        slide2[0].style.webkitTransform = "none";
      }
      if (params.roundLengths) {
        slideSize = swiper.isHorizontal() ? slide2.outerWidth(true) : slide2.outerHeight(true);
      } else {
        const width = getDirectionPropertyValue(slideStyles, "width");
        const paddingLeft = getDirectionPropertyValue(slideStyles, "padding-left");
        const paddingRight = getDirectionPropertyValue(slideStyles, "padding-right");
        const marginLeft = getDirectionPropertyValue(slideStyles, "margin-left");
        const marginRight = getDirectionPropertyValue(slideStyles, "margin-right");
        const boxSizing = slideStyles.getPropertyValue("box-sizing");
        if (boxSizing && boxSizing === "border-box") {
          slideSize = width + marginLeft + marginRight;
        } else {
          const {
            clientWidth,
            offsetWidth
          } = slide2[0];
          slideSize = width + paddingLeft + paddingRight + marginLeft + marginRight + (offsetWidth - clientWidth);
        }
      }
      if (currentTransform) {
        slide2[0].style.transform = currentTransform;
      }
      if (currentWebKitTransform) {
        slide2[0].style.webkitTransform = currentWebKitTransform;
      }
      if (params.roundLengths)
        slideSize = Math.floor(slideSize);
    } else {
      slideSize = (swiperSize - (params.slidesPerView - 1) * spaceBetween) / params.slidesPerView;
      if (params.roundLengths)
        slideSize = Math.floor(slideSize);
      if (slides[i]) {
        slides[i].style[getDirectionLabel("width")] = `${slideSize}px`;
      }
    }
    if (slides[i]) {
      slides[i].swiperSlideSize = slideSize;
    }
    slidesSizesGrid.push(slideSize);
    if (params.centeredSlides) {
      slidePosition = slidePosition + slideSize / 2 + prevSlideSize / 2 + spaceBetween;
      if (prevSlideSize === 0 && i !== 0)
        slidePosition = slidePosition - swiperSize / 2 - spaceBetween;
      if (i === 0)
        slidePosition = slidePosition - swiperSize / 2 - spaceBetween;
      if (Math.abs(slidePosition) < 1 / 1e3)
        slidePosition = 0;
      if (params.roundLengths)
        slidePosition = Math.floor(slidePosition);
      if (index2 % params.slidesPerGroup === 0)
        snapGrid.push(slidePosition);
      slidesGrid.push(slidePosition);
    } else {
      if (params.roundLengths)
        slidePosition = Math.floor(slidePosition);
      if ((index2 - Math.min(swiper.params.slidesPerGroupSkip, index2)) % swiper.params.slidesPerGroup === 0)
        snapGrid.push(slidePosition);
      slidesGrid.push(slidePosition);
      slidePosition = slidePosition + slideSize + spaceBetween;
    }
    swiper.virtualSize += slideSize + spaceBetween;
    prevSlideSize = slideSize;
    index2 += 1;
  }
  swiper.virtualSize = Math.max(swiper.virtualSize, swiperSize) + offsetAfter;
  if (rtl && wrongRTL && (params.effect === "slide" || params.effect === "coverflow")) {
    $wrapperEl.css({
      width: `${swiper.virtualSize + params.spaceBetween}px`
    });
  }
  if (params.setWrapperSize) {
    $wrapperEl.css({
      [getDirectionLabel("width")]: `${swiper.virtualSize + params.spaceBetween}px`
    });
  }
  if (gridEnabled) {
    swiper.grid.updateWrapperSize(slideSize, snapGrid, getDirectionLabel);
  }
  if (!params.centeredSlides) {
    const newSlidesGrid = [];
    for (let i = 0; i < snapGrid.length; i += 1) {
      let slidesGridItem = snapGrid[i];
      if (params.roundLengths)
        slidesGridItem = Math.floor(slidesGridItem);
      if (snapGrid[i] <= swiper.virtualSize - swiperSize) {
        newSlidesGrid.push(slidesGridItem);
      }
    }
    snapGrid = newSlidesGrid;
    if (Math.floor(swiper.virtualSize - swiperSize) - Math.floor(snapGrid[snapGrid.length - 1]) > 1) {
      snapGrid.push(swiper.virtualSize - swiperSize);
    }
  }
  if (snapGrid.length === 0)
    snapGrid = [0];
  if (params.spaceBetween !== 0) {
    const key = swiper.isHorizontal() && rtl ? "marginLeft" : getDirectionLabel("marginRight");
    slides.filter((_, slideIndex) => {
      if (!params.cssMode)
        return true;
      if (slideIndex === slides.length - 1) {
        return false;
      }
      return true;
    }).css({
      [key]: `${spaceBetween}px`
    });
  }
  if (params.centeredSlides && params.centeredSlidesBounds) {
    let allSlidesSize = 0;
    slidesSizesGrid.forEach((slideSizeValue) => {
      allSlidesSize += slideSizeValue + (params.spaceBetween ? params.spaceBetween : 0);
    });
    allSlidesSize -= params.spaceBetween;
    const maxSnap = allSlidesSize - swiperSize;
    snapGrid = snapGrid.map((snap) => {
      if (snap < 0)
        return -offsetBefore;
      if (snap > maxSnap)
        return maxSnap + offsetAfter;
      return snap;
    });
  }
  if (params.centerInsufficientSlides) {
    let allSlidesSize = 0;
    slidesSizesGrid.forEach((slideSizeValue) => {
      allSlidesSize += slideSizeValue + (params.spaceBetween ? params.spaceBetween : 0);
    });
    allSlidesSize -= params.spaceBetween;
    if (allSlidesSize < swiperSize) {
      const allSlidesOffset = (swiperSize - allSlidesSize) / 2;
      snapGrid.forEach((snap, snapIndex) => {
        snapGrid[snapIndex] = snap - allSlidesOffset;
      });
      slidesGrid.forEach((snap, snapIndex) => {
        slidesGrid[snapIndex] = snap + allSlidesOffset;
      });
    }
  }
  Object.assign(swiper, {
    slides,
    snapGrid,
    slidesGrid,
    slidesSizesGrid
  });
  if (params.centeredSlides && params.cssMode && !params.centeredSlidesBounds) {
    setCSSProperty(swiper.wrapperEl, "--swiper-centered-offset-before", `${-snapGrid[0]}px`);
    setCSSProperty(swiper.wrapperEl, "--swiper-centered-offset-after", `${swiper.size / 2 - slidesSizesGrid[slidesSizesGrid.length - 1] / 2}px`);
    const addToSnapGrid = -swiper.snapGrid[0];
    const addToSlidesGrid = -swiper.slidesGrid[0];
    swiper.snapGrid = swiper.snapGrid.map((v) => v + addToSnapGrid);
    swiper.slidesGrid = swiper.slidesGrid.map((v) => v + addToSlidesGrid);
  }
  if (slidesLength !== previousSlidesLength) {
    swiper.emit("slidesLengthChange");
  }
  if (snapGrid.length !== previousSnapGridLength) {
    if (swiper.params.watchOverflow)
      swiper.checkOverflow();
    swiper.emit("snapGridLengthChange");
  }
  if (slidesGrid.length !== previousSlidesGridLength) {
    swiper.emit("slidesGridLengthChange");
  }
  if (params.watchSlidesProgress) {
    swiper.updateSlidesOffset();
  }
}
function updateAutoHeight(speed) {
  const swiper = this;
  const activeSlides = [];
  const isVirtual = swiper.virtual && swiper.params.virtual.enabled;
  let newHeight = 0;
  let i;
  if (typeof speed === "number") {
    swiper.setTransition(speed);
  } else if (speed === true) {
    swiper.setTransition(swiper.params.speed);
  }
  const getSlideByIndex = (index2) => {
    if (isVirtual) {
      return swiper.slides.filter((el) => parseInt(el.getAttribute("data-swiper-slide-index"), 10) === index2)[0];
    }
    return swiper.slides.eq(index2)[0];
  };
  if (swiper.params.slidesPerView !== "auto" && swiper.params.slidesPerView > 1) {
    if (swiper.params.centeredSlides) {
      swiper.visibleSlides.each((slide2) => {
        activeSlides.push(slide2);
      });
    } else {
      for (i = 0; i < Math.ceil(swiper.params.slidesPerView); i += 1) {
        const index2 = swiper.activeIndex + i;
        if (index2 > swiper.slides.length && !isVirtual)
          break;
        activeSlides.push(getSlideByIndex(index2));
      }
    }
  } else {
    activeSlides.push(getSlideByIndex(swiper.activeIndex));
  }
  for (i = 0; i < activeSlides.length; i += 1) {
    if (typeof activeSlides[i] !== "undefined") {
      const height = activeSlides[i].offsetHeight;
      newHeight = height > newHeight ? height : newHeight;
    }
  }
  if (newHeight || newHeight === 0)
    swiper.$wrapperEl.css("height", `${newHeight}px`);
}
function updateSlidesOffset() {
  const swiper = this;
  const slides = swiper.slides;
  for (let i = 0; i < slides.length; i += 1) {
    slides[i].swiperSlideOffset = swiper.isHorizontal() ? slides[i].offsetLeft : slides[i].offsetTop;
  }
}
function updateSlidesProgress(translate2 = this && this.translate || 0) {
  const swiper = this;
  const params = swiper.params;
  const {
    slides,
    rtlTranslate: rtl,
    snapGrid
  } = swiper;
  if (slides.length === 0)
    return;
  if (typeof slides[0].swiperSlideOffset === "undefined")
    swiper.updateSlidesOffset();
  let offsetCenter = -translate2;
  if (rtl)
    offsetCenter = translate2;
  slides.removeClass(params.slideVisibleClass);
  swiper.visibleSlidesIndexes = [];
  swiper.visibleSlides = [];
  for (let i = 0; i < slides.length; i += 1) {
    const slide2 = slides[i];
    let slideOffset = slide2.swiperSlideOffset;
    if (params.cssMode && params.centeredSlides) {
      slideOffset -= slides[0].swiperSlideOffset;
    }
    const slideProgress = (offsetCenter + (params.centeredSlides ? swiper.minTranslate() : 0) - slideOffset) / (slide2.swiperSlideSize + params.spaceBetween);
    const originalSlideProgress = (offsetCenter - snapGrid[0] + (params.centeredSlides ? swiper.minTranslate() : 0) - slideOffset) / (slide2.swiperSlideSize + params.spaceBetween);
    const slideBefore = -(offsetCenter - slideOffset);
    const slideAfter = slideBefore + swiper.slidesSizesGrid[i];
    const isVisible = slideBefore >= 0 && slideBefore < swiper.size - 1 || slideAfter > 1 && slideAfter <= swiper.size || slideBefore <= 0 && slideAfter >= swiper.size;
    if (isVisible) {
      swiper.visibleSlides.push(slide2);
      swiper.visibleSlidesIndexes.push(i);
      slides.eq(i).addClass(params.slideVisibleClass);
    }
    slide2.progress = rtl ? -slideProgress : slideProgress;
    slide2.originalProgress = rtl ? -originalSlideProgress : originalSlideProgress;
  }
  swiper.visibleSlides = $(swiper.visibleSlides);
}
function updateProgress(translate2) {
  const swiper = this;
  if (typeof translate2 === "undefined") {
    const multiplier = swiper.rtlTranslate ? -1 : 1;
    translate2 = swiper && swiper.translate && swiper.translate * multiplier || 0;
  }
  const params = swiper.params;
  const translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
  let {
    progress,
    isBeginning,
    isEnd
  } = swiper;
  const wasBeginning = isBeginning;
  const wasEnd = isEnd;
  if (translatesDiff === 0) {
    progress = 0;
    isBeginning = true;
    isEnd = true;
  } else {
    progress = (translate2 - swiper.minTranslate()) / translatesDiff;
    isBeginning = progress <= 0;
    isEnd = progress >= 1;
  }
  Object.assign(swiper, {
    progress,
    isBeginning,
    isEnd
  });
  if (params.watchSlidesProgress || params.centeredSlides && params.autoHeight)
    swiper.updateSlidesProgress(translate2);
  if (isBeginning && !wasBeginning) {
    swiper.emit("reachBeginning toEdge");
  }
  if (isEnd && !wasEnd) {
    swiper.emit("reachEnd toEdge");
  }
  if (wasBeginning && !isBeginning || wasEnd && !isEnd) {
    swiper.emit("fromEdge");
  }
  swiper.emit("progress", progress);
}
function updateSlidesClasses() {
  const swiper = this;
  const {
    slides,
    params,
    $wrapperEl,
    activeIndex,
    realIndex
  } = swiper;
  const isVirtual = swiper.virtual && params.virtual.enabled;
  slides.removeClass(`${params.slideActiveClass} ${params.slideNextClass} ${params.slidePrevClass} ${params.slideDuplicateActiveClass} ${params.slideDuplicateNextClass} ${params.slideDuplicatePrevClass}`);
  let activeSlide;
  if (isVirtual) {
    activeSlide = swiper.$wrapperEl.find(`.${params.slideClass}[data-swiper-slide-index="${activeIndex}"]`);
  } else {
    activeSlide = slides.eq(activeIndex);
  }
  activeSlide.addClass(params.slideActiveClass);
  if (params.loop) {
    if (activeSlide.hasClass(params.slideDuplicateClass)) {
      $wrapperEl.children(`.${params.slideClass}:not(.${params.slideDuplicateClass})[data-swiper-slide-index="${realIndex}"]`).addClass(params.slideDuplicateActiveClass);
    } else {
      $wrapperEl.children(`.${params.slideClass}.${params.slideDuplicateClass}[data-swiper-slide-index="${realIndex}"]`).addClass(params.slideDuplicateActiveClass);
    }
  }
  let nextSlide = activeSlide.nextAll(`.${params.slideClass}`).eq(0).addClass(params.slideNextClass);
  if (params.loop && nextSlide.length === 0) {
    nextSlide = slides.eq(0);
    nextSlide.addClass(params.slideNextClass);
  }
  let prevSlide = activeSlide.prevAll(`.${params.slideClass}`).eq(0).addClass(params.slidePrevClass);
  if (params.loop && prevSlide.length === 0) {
    prevSlide = slides.eq(-1);
    prevSlide.addClass(params.slidePrevClass);
  }
  if (params.loop) {
    if (nextSlide.hasClass(params.slideDuplicateClass)) {
      $wrapperEl.children(`.${params.slideClass}:not(.${params.slideDuplicateClass})[data-swiper-slide-index="${nextSlide.attr("data-swiper-slide-index")}"]`).addClass(params.slideDuplicateNextClass);
    } else {
      $wrapperEl.children(`.${params.slideClass}.${params.slideDuplicateClass}[data-swiper-slide-index="${nextSlide.attr("data-swiper-slide-index")}"]`).addClass(params.slideDuplicateNextClass);
    }
    if (prevSlide.hasClass(params.slideDuplicateClass)) {
      $wrapperEl.children(`.${params.slideClass}:not(.${params.slideDuplicateClass})[data-swiper-slide-index="${prevSlide.attr("data-swiper-slide-index")}"]`).addClass(params.slideDuplicatePrevClass);
    } else {
      $wrapperEl.children(`.${params.slideClass}.${params.slideDuplicateClass}[data-swiper-slide-index="${prevSlide.attr("data-swiper-slide-index")}"]`).addClass(params.slideDuplicatePrevClass);
    }
  }
  swiper.emitSlidesClasses();
}
function updateActiveIndex(newActiveIndex) {
  const swiper = this;
  const translate2 = swiper.rtlTranslate ? swiper.translate : -swiper.translate;
  const {
    slidesGrid,
    snapGrid,
    params,
    activeIndex: previousIndex,
    realIndex: previousRealIndex,
    snapIndex: previousSnapIndex
  } = swiper;
  let activeIndex = newActiveIndex;
  let snapIndex;
  if (typeof activeIndex === "undefined") {
    for (let i = 0; i < slidesGrid.length; i += 1) {
      if (typeof slidesGrid[i + 1] !== "undefined") {
        if (translate2 >= slidesGrid[i] && translate2 < slidesGrid[i + 1] - (slidesGrid[i + 1] - slidesGrid[i]) / 2) {
          activeIndex = i;
        } else if (translate2 >= slidesGrid[i] && translate2 < slidesGrid[i + 1]) {
          activeIndex = i + 1;
        }
      } else if (translate2 >= slidesGrid[i]) {
        activeIndex = i;
      }
    }
    if (params.normalizeSlideIndex) {
      if (activeIndex < 0 || typeof activeIndex === "undefined")
        activeIndex = 0;
    }
  }
  if (snapGrid.indexOf(translate2) >= 0) {
    snapIndex = snapGrid.indexOf(translate2);
  } else {
    const skip = Math.min(params.slidesPerGroupSkip, activeIndex);
    snapIndex = skip + Math.floor((activeIndex - skip) / params.slidesPerGroup);
  }
  if (snapIndex >= snapGrid.length)
    snapIndex = snapGrid.length - 1;
  if (activeIndex === previousIndex) {
    if (snapIndex !== previousSnapIndex) {
      swiper.snapIndex = snapIndex;
      swiper.emit("snapIndexChange");
    }
    return;
  }
  const realIndex = parseInt(swiper.slides.eq(activeIndex).attr("data-swiper-slide-index") || activeIndex, 10);
  Object.assign(swiper, {
    snapIndex,
    realIndex,
    previousIndex,
    activeIndex
  });
  swiper.emit("activeIndexChange");
  swiper.emit("snapIndexChange");
  if (previousRealIndex !== realIndex) {
    swiper.emit("realIndexChange");
  }
  if (swiper.initialized || swiper.params.runCallbacksOnInit) {
    swiper.emit("slideChange");
  }
}
function updateClickedSlide(e) {
  const swiper = this;
  const params = swiper.params;
  const slide2 = $(e).closest(`.${params.slideClass}`)[0];
  let slideFound = false;
  let slideIndex;
  if (slide2) {
    for (let i = 0; i < swiper.slides.length; i += 1) {
      if (swiper.slides[i] === slide2) {
        slideFound = true;
        slideIndex = i;
        break;
      }
    }
  }
  if (slide2 && slideFound) {
    swiper.clickedSlide = slide2;
    if (swiper.virtual && swiper.params.virtual.enabled) {
      swiper.clickedIndex = parseInt($(slide2).attr("data-swiper-slide-index"), 10);
    } else {
      swiper.clickedIndex = slideIndex;
    }
  } else {
    swiper.clickedSlide = void 0;
    swiper.clickedIndex = void 0;
    return;
  }
  if (params.slideToClickedSlide && swiper.clickedIndex !== void 0 && swiper.clickedIndex !== swiper.activeIndex) {
    swiper.slideToClickedSlide();
  }
}
function getSwiperTranslate(axis = this.isHorizontal() ? "x" : "y") {
  const swiper = this;
  const {
    params,
    rtlTranslate: rtl,
    translate: translate2,
    $wrapperEl
  } = swiper;
  if (params.virtualTranslate) {
    return rtl ? -translate2 : translate2;
  }
  if (params.cssMode) {
    return translate2;
  }
  let currentTranslate = getTranslate($wrapperEl[0], axis);
  if (rtl)
    currentTranslate = -currentTranslate;
  return currentTranslate || 0;
}
function setTranslate(translate2, byController) {
  const swiper = this;
  const {
    rtlTranslate: rtl,
    params,
    $wrapperEl,
    wrapperEl,
    progress
  } = swiper;
  let x = 0;
  let y = 0;
  const z = 0;
  if (swiper.isHorizontal()) {
    x = rtl ? -translate2 : translate2;
  } else {
    y = translate2;
  }
  if (params.roundLengths) {
    x = Math.floor(x);
    y = Math.floor(y);
  }
  if (params.cssMode) {
    wrapperEl[swiper.isHorizontal() ? "scrollLeft" : "scrollTop"] = swiper.isHorizontal() ? -x : -y;
  } else if (!params.virtualTranslate) {
    $wrapperEl.transform(`translate3d(${x}px, ${y}px, ${z}px)`);
  }
  swiper.previousTranslate = swiper.translate;
  swiper.translate = swiper.isHorizontal() ? x : y;
  let newProgress;
  const translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
  if (translatesDiff === 0) {
    newProgress = 0;
  } else {
    newProgress = (translate2 - swiper.minTranslate()) / translatesDiff;
  }
  if (newProgress !== progress) {
    swiper.updateProgress(translate2);
  }
  swiper.emit("setTranslate", swiper.translate, byController);
}
function minTranslate() {
  return -this.snapGrid[0];
}
function maxTranslate() {
  return -this.snapGrid[this.snapGrid.length - 1];
}
function translateTo(translate2 = 0, speed = this.params.speed, runCallbacks = true, translateBounds = true, internal) {
  const swiper = this;
  const {
    params,
    wrapperEl
  } = swiper;
  if (swiper.animating && params.preventInteractionOnTransition) {
    return false;
  }
  const minTranslate2 = swiper.minTranslate();
  const maxTranslate2 = swiper.maxTranslate();
  let newTranslate;
  if (translateBounds && translate2 > minTranslate2)
    newTranslate = minTranslate2;
  else if (translateBounds && translate2 < maxTranslate2)
    newTranslate = maxTranslate2;
  else
    newTranslate = translate2;
  swiper.updateProgress(newTranslate);
  if (params.cssMode) {
    const isH = swiper.isHorizontal();
    if (speed === 0) {
      wrapperEl[isH ? "scrollLeft" : "scrollTop"] = -newTranslate;
    } else {
      if (!swiper.support.smoothScroll) {
        animateCSSModeScroll({
          swiper,
          targetPosition: -newTranslate,
          side: isH ? "left" : "top"
        });
        return true;
      }
      wrapperEl.scrollTo({
        [isH ? "left" : "top"]: -newTranslate,
        behavior: "smooth"
      });
    }
    return true;
  }
  if (speed === 0) {
    swiper.setTransition(0);
    swiper.setTranslate(newTranslate);
    if (runCallbacks) {
      swiper.emit("beforeTransitionStart", speed, internal);
      swiper.emit("transitionEnd");
    }
  } else {
    swiper.setTransition(speed);
    swiper.setTranslate(newTranslate);
    if (runCallbacks) {
      swiper.emit("beforeTransitionStart", speed, internal);
      swiper.emit("transitionStart");
    }
    if (!swiper.animating) {
      swiper.animating = true;
      if (!swiper.onTranslateToWrapperTransitionEnd) {
        swiper.onTranslateToWrapperTransitionEnd = function transitionEnd2(e) {
          if (!swiper || swiper.destroyed)
            return;
          if (e.target !== this)
            return;
          swiper.$wrapperEl[0].removeEventListener("transitionend", swiper.onTranslateToWrapperTransitionEnd);
          swiper.$wrapperEl[0].removeEventListener("webkitTransitionEnd", swiper.onTranslateToWrapperTransitionEnd);
          swiper.onTranslateToWrapperTransitionEnd = null;
          delete swiper.onTranslateToWrapperTransitionEnd;
          if (runCallbacks) {
            swiper.emit("transitionEnd");
          }
        };
      }
      swiper.$wrapperEl[0].addEventListener("transitionend", swiper.onTranslateToWrapperTransitionEnd);
      swiper.$wrapperEl[0].addEventListener("webkitTransitionEnd", swiper.onTranslateToWrapperTransitionEnd);
    }
  }
  return true;
}
function setTransition(duration, byController) {
  const swiper = this;
  if (!swiper.params.cssMode) {
    swiper.$wrapperEl.transition(duration);
  }
  swiper.emit("setTransition", duration, byController);
}
function transitionEmit({
  swiper,
  runCallbacks,
  direction,
  step
}) {
  const {
    activeIndex,
    previousIndex
  } = swiper;
  let dir = direction;
  if (!dir) {
    if (activeIndex > previousIndex)
      dir = "next";
    else if (activeIndex < previousIndex)
      dir = "prev";
    else
      dir = "reset";
  }
  swiper.emit(`transition${step}`);
  if (runCallbacks && activeIndex !== previousIndex) {
    if (dir === "reset") {
      swiper.emit(`slideResetTransition${step}`);
      return;
    }
    swiper.emit(`slideChangeTransition${step}`);
    if (dir === "next") {
      swiper.emit(`slideNextTransition${step}`);
    } else {
      swiper.emit(`slidePrevTransition${step}`);
    }
  }
}
function transitionStart(runCallbacks = true, direction) {
  const swiper = this;
  const {
    params
  } = swiper;
  if (params.cssMode)
    return;
  if (params.autoHeight) {
    swiper.updateAutoHeight();
  }
  transitionEmit({
    swiper,
    runCallbacks,
    direction,
    step: "Start"
  });
}
function transitionEnd(runCallbacks = true, direction) {
  const swiper = this;
  const {
    params
  } = swiper;
  swiper.animating = false;
  if (params.cssMode)
    return;
  swiper.setTransition(0);
  transitionEmit({
    swiper,
    runCallbacks,
    direction,
    step: "End"
  });
}
function slideTo(index2 = 0, speed = this.params.speed, runCallbacks = true, internal, initial) {
  if (typeof index2 !== "number" && typeof index2 !== "string") {
    throw new Error(`The 'index' argument cannot have type other than 'number' or 'string'. [${typeof index2}] given.`);
  }
  if (typeof index2 === "string") {
    const indexAsNumber = parseInt(index2, 10);
    const isValidNumber = isFinite(indexAsNumber);
    if (!isValidNumber) {
      throw new Error(`The passed-in 'index' (string) couldn't be converted to 'number'. [${index2}] given.`);
    }
    index2 = indexAsNumber;
  }
  const swiper = this;
  let slideIndex = index2;
  if (slideIndex < 0)
    slideIndex = 0;
  const {
    params,
    snapGrid,
    slidesGrid,
    previousIndex,
    activeIndex,
    rtlTranslate: rtl,
    wrapperEl,
    enabled
  } = swiper;
  if (swiper.animating && params.preventInteractionOnTransition || !enabled && !internal && !initial) {
    return false;
  }
  const skip = Math.min(swiper.params.slidesPerGroupSkip, slideIndex);
  let snapIndex = skip + Math.floor((slideIndex - skip) / swiper.params.slidesPerGroup);
  if (snapIndex >= snapGrid.length)
    snapIndex = snapGrid.length - 1;
  if ((activeIndex || params.initialSlide || 0) === (previousIndex || 0) && runCallbacks) {
    swiper.emit("beforeSlideChangeStart");
  }
  const translate2 = -snapGrid[snapIndex];
  swiper.updateProgress(translate2);
  if (params.normalizeSlideIndex) {
    for (let i = 0; i < slidesGrid.length; i += 1) {
      const normalizedTranslate = -Math.floor(translate2 * 100);
      const normalizedGrid = Math.floor(slidesGrid[i] * 100);
      const normalizedGridNext = Math.floor(slidesGrid[i + 1] * 100);
      if (typeof slidesGrid[i + 1] !== "undefined") {
        if (normalizedTranslate >= normalizedGrid && normalizedTranslate < normalizedGridNext - (normalizedGridNext - normalizedGrid) / 2) {
          slideIndex = i;
        } else if (normalizedTranslate >= normalizedGrid && normalizedTranslate < normalizedGridNext) {
          slideIndex = i + 1;
        }
      } else if (normalizedTranslate >= normalizedGrid) {
        slideIndex = i;
      }
    }
  }
  if (swiper.initialized && slideIndex !== activeIndex) {
    if (!swiper.allowSlideNext && translate2 < swiper.translate && translate2 < swiper.minTranslate()) {
      return false;
    }
    if (!swiper.allowSlidePrev && translate2 > swiper.translate && translate2 > swiper.maxTranslate()) {
      if ((activeIndex || 0) !== slideIndex)
        return false;
    }
  }
  let direction;
  if (slideIndex > activeIndex)
    direction = "next";
  else if (slideIndex < activeIndex)
    direction = "prev";
  else
    direction = "reset";
  if (rtl && -translate2 === swiper.translate || !rtl && translate2 === swiper.translate) {
    swiper.updateActiveIndex(slideIndex);
    if (params.autoHeight) {
      swiper.updateAutoHeight();
    }
    swiper.updateSlidesClasses();
    if (params.effect !== "slide") {
      swiper.setTranslate(translate2);
    }
    if (direction !== "reset") {
      swiper.transitionStart(runCallbacks, direction);
      swiper.transitionEnd(runCallbacks, direction);
    }
    return false;
  }
  if (params.cssMode) {
    const isH = swiper.isHorizontal();
    const t = rtl ? translate2 : -translate2;
    if (speed === 0) {
      const isVirtual = swiper.virtual && swiper.params.virtual.enabled;
      if (isVirtual) {
        swiper.wrapperEl.style.scrollSnapType = "none";
        swiper._immediateVirtual = true;
      }
      wrapperEl[isH ? "scrollLeft" : "scrollTop"] = t;
      if (isVirtual) {
        requestAnimationFrame(() => {
          swiper.wrapperEl.style.scrollSnapType = "";
          swiper._swiperImmediateVirtual = false;
        });
      }
    } else {
      if (!swiper.support.smoothScroll) {
        animateCSSModeScroll({
          swiper,
          targetPosition: t,
          side: isH ? "left" : "top"
        });
        return true;
      }
      wrapperEl.scrollTo({
        [isH ? "left" : "top"]: t,
        behavior: "smooth"
      });
    }
    return true;
  }
  swiper.setTransition(speed);
  swiper.setTranslate(translate2);
  swiper.updateActiveIndex(slideIndex);
  swiper.updateSlidesClasses();
  swiper.emit("beforeTransitionStart", speed, internal);
  swiper.transitionStart(runCallbacks, direction);
  if (speed === 0) {
    swiper.transitionEnd(runCallbacks, direction);
  } else if (!swiper.animating) {
    swiper.animating = true;
    if (!swiper.onSlideToWrapperTransitionEnd) {
      swiper.onSlideToWrapperTransitionEnd = function transitionEnd2(e) {
        if (!swiper || swiper.destroyed)
          return;
        if (e.target !== this)
          return;
        swiper.$wrapperEl[0].removeEventListener("transitionend", swiper.onSlideToWrapperTransitionEnd);
        swiper.$wrapperEl[0].removeEventListener("webkitTransitionEnd", swiper.onSlideToWrapperTransitionEnd);
        swiper.onSlideToWrapperTransitionEnd = null;
        delete swiper.onSlideToWrapperTransitionEnd;
        swiper.transitionEnd(runCallbacks, direction);
      };
    }
    swiper.$wrapperEl[0].addEventListener("transitionend", swiper.onSlideToWrapperTransitionEnd);
    swiper.$wrapperEl[0].addEventListener("webkitTransitionEnd", swiper.onSlideToWrapperTransitionEnd);
  }
  return true;
}
function slideToLoop(index2 = 0, speed = this.params.speed, runCallbacks = true, internal) {
  const swiper = this;
  let newIndex = index2;
  if (swiper.params.loop) {
    newIndex += swiper.loopedSlides;
  }
  return swiper.slideTo(newIndex, speed, runCallbacks, internal);
}
function slideNext(speed = this.params.speed, runCallbacks = true, internal) {
  const swiper = this;
  const {
    animating,
    enabled,
    params
  } = swiper;
  if (!enabled)
    return swiper;
  let perGroup = params.slidesPerGroup;
  if (params.slidesPerView === "auto" && params.slidesPerGroup === 1 && params.slidesPerGroupAuto) {
    perGroup = Math.max(swiper.slidesPerViewDynamic("current", true), 1);
  }
  const increment = swiper.activeIndex < params.slidesPerGroupSkip ? 1 : perGroup;
  if (params.loop) {
    if (animating && params.loopPreventsSlide)
      return false;
    swiper.loopFix();
    swiper._clientLeft = swiper.$wrapperEl[0].clientLeft;
  }
  if (params.rewind && swiper.isEnd) {
    return swiper.slideTo(0, speed, runCallbacks, internal);
  }
  return swiper.slideTo(swiper.activeIndex + increment, speed, runCallbacks, internal);
}
function slidePrev(speed = this.params.speed, runCallbacks = true, internal) {
  const swiper = this;
  const {
    params,
    animating,
    snapGrid,
    slidesGrid,
    rtlTranslate,
    enabled
  } = swiper;
  if (!enabled)
    return swiper;
  if (params.loop) {
    if (animating && params.loopPreventsSlide)
      return false;
    swiper.loopFix();
    swiper._clientLeft = swiper.$wrapperEl[0].clientLeft;
  }
  const translate2 = rtlTranslate ? swiper.translate : -swiper.translate;
  function normalize2(val) {
    if (val < 0)
      return -Math.floor(Math.abs(val));
    return Math.floor(val);
  }
  const normalizedTranslate = normalize2(translate2);
  const normalizedSnapGrid = snapGrid.map((val) => normalize2(val));
  let prevSnap = snapGrid[normalizedSnapGrid.indexOf(normalizedTranslate) - 1];
  if (typeof prevSnap === "undefined" && params.cssMode) {
    let prevSnapIndex;
    snapGrid.forEach((snap, snapIndex) => {
      if (normalizedTranslate >= snap) {
        prevSnapIndex = snapIndex;
      }
    });
    if (typeof prevSnapIndex !== "undefined") {
      prevSnap = snapGrid[prevSnapIndex > 0 ? prevSnapIndex - 1 : prevSnapIndex];
    }
  }
  let prevIndex = 0;
  if (typeof prevSnap !== "undefined") {
    prevIndex = slidesGrid.indexOf(prevSnap);
    if (prevIndex < 0)
      prevIndex = swiper.activeIndex - 1;
    if (params.slidesPerView === "auto" && params.slidesPerGroup === 1 && params.slidesPerGroupAuto) {
      prevIndex = prevIndex - swiper.slidesPerViewDynamic("previous", true) + 1;
      prevIndex = Math.max(prevIndex, 0);
    }
  }
  if (params.rewind && swiper.isBeginning) {
    return swiper.slideTo(swiper.slides.length - 1, speed, runCallbacks, internal);
  }
  return swiper.slideTo(prevIndex, speed, runCallbacks, internal);
}
function slideReset(speed = this.params.speed, runCallbacks = true, internal) {
  const swiper = this;
  return swiper.slideTo(swiper.activeIndex, speed, runCallbacks, internal);
}
function slideToClosest(speed = this.params.speed, runCallbacks = true, internal, threshold = 0.5) {
  const swiper = this;
  let index2 = swiper.activeIndex;
  const skip = Math.min(swiper.params.slidesPerGroupSkip, index2);
  const snapIndex = skip + Math.floor((index2 - skip) / swiper.params.slidesPerGroup);
  const translate2 = swiper.rtlTranslate ? swiper.translate : -swiper.translate;
  if (translate2 >= swiper.snapGrid[snapIndex]) {
    const currentSnap = swiper.snapGrid[snapIndex];
    const nextSnap = swiper.snapGrid[snapIndex + 1];
    if (translate2 - currentSnap > (nextSnap - currentSnap) * threshold) {
      index2 += swiper.params.slidesPerGroup;
    }
  } else {
    const prevSnap = swiper.snapGrid[snapIndex - 1];
    const currentSnap = swiper.snapGrid[snapIndex];
    if (translate2 - prevSnap <= (currentSnap - prevSnap) * threshold) {
      index2 -= swiper.params.slidesPerGroup;
    }
  }
  index2 = Math.max(index2, 0);
  index2 = Math.min(index2, swiper.slidesGrid.length - 1);
  return swiper.slideTo(index2, speed, runCallbacks, internal);
}
function slideToClickedSlide() {
  const swiper = this;
  const {
    params,
    $wrapperEl
  } = swiper;
  const slidesPerView = params.slidesPerView === "auto" ? swiper.slidesPerViewDynamic() : params.slidesPerView;
  let slideToIndex = swiper.clickedIndex;
  let realIndex;
  if (params.loop) {
    if (swiper.animating)
      return;
    realIndex = parseInt($(swiper.clickedSlide).attr("data-swiper-slide-index"), 10);
    if (params.centeredSlides) {
      if (slideToIndex < swiper.loopedSlides - slidesPerView / 2 || slideToIndex > swiper.slides.length - swiper.loopedSlides + slidesPerView / 2) {
        swiper.loopFix();
        slideToIndex = $wrapperEl.children(`.${params.slideClass}[data-swiper-slide-index="${realIndex}"]:not(.${params.slideDuplicateClass})`).eq(0).index();
        nextTick(() => {
          swiper.slideTo(slideToIndex);
        });
      } else {
        swiper.slideTo(slideToIndex);
      }
    } else if (slideToIndex > swiper.slides.length - slidesPerView) {
      swiper.loopFix();
      slideToIndex = $wrapperEl.children(`.${params.slideClass}[data-swiper-slide-index="${realIndex}"]:not(.${params.slideDuplicateClass})`).eq(0).index();
      nextTick(() => {
        swiper.slideTo(slideToIndex);
      });
    } else {
      swiper.slideTo(slideToIndex);
    }
  } else {
    swiper.slideTo(slideToIndex);
  }
}
function loopCreate() {
  const swiper = this;
  const document2 = getDocument();
  const {
    params,
    $wrapperEl
  } = swiper;
  const $selector = $wrapperEl.children().length > 0 ? $($wrapperEl.children()[0].parentNode) : $wrapperEl;
  $selector.children(`.${params.slideClass}.${params.slideDuplicateClass}`).remove();
  let slides = $selector.children(`.${params.slideClass}`);
  if (params.loopFillGroupWithBlank) {
    const blankSlidesNum = params.slidesPerGroup - slides.length % params.slidesPerGroup;
    if (blankSlidesNum !== params.slidesPerGroup) {
      for (let i = 0; i < blankSlidesNum; i += 1) {
        const blankNode = $(document2.createElement("div")).addClass(`${params.slideClass} ${params.slideBlankClass}`);
        $selector.append(blankNode);
      }
      slides = $selector.children(`.${params.slideClass}`);
    }
  }
  if (params.slidesPerView === "auto" && !params.loopedSlides)
    params.loopedSlides = slides.length;
  swiper.loopedSlides = Math.ceil(parseFloat(params.loopedSlides || params.slidesPerView, 10));
  swiper.loopedSlides += params.loopAdditionalSlides;
  if (swiper.loopedSlides > slides.length) {
    swiper.loopedSlides = slides.length;
  }
  const prependSlides = [];
  const appendSlides = [];
  slides.each((el, index2) => {
    const slide2 = $(el);
    if (index2 < swiper.loopedSlides) {
      appendSlides.push(el);
    }
    if (index2 < slides.length && index2 >= slides.length - swiper.loopedSlides) {
      prependSlides.push(el);
    }
    slide2.attr("data-swiper-slide-index", index2);
  });
  for (let i = 0; i < appendSlides.length; i += 1) {
    $selector.append($(appendSlides[i].cloneNode(true)).addClass(params.slideDuplicateClass));
  }
  for (let i = prependSlides.length - 1; i >= 0; i -= 1) {
    $selector.prepend($(prependSlides[i].cloneNode(true)).addClass(params.slideDuplicateClass));
  }
}
function loopFix() {
  const swiper = this;
  swiper.emit("beforeLoopFix");
  const {
    activeIndex,
    slides,
    loopedSlides,
    allowSlidePrev,
    allowSlideNext,
    snapGrid,
    rtlTranslate: rtl
  } = swiper;
  let newIndex;
  swiper.allowSlidePrev = true;
  swiper.allowSlideNext = true;
  const snapTranslate = -snapGrid[activeIndex];
  const diff = snapTranslate - swiper.getTranslate();
  if (activeIndex < loopedSlides) {
    newIndex = slides.length - loopedSlides * 3 + activeIndex;
    newIndex += loopedSlides;
    const slideChanged = swiper.slideTo(newIndex, 0, false, true);
    if (slideChanged && diff !== 0) {
      swiper.setTranslate((rtl ? -swiper.translate : swiper.translate) - diff);
    }
  } else if (activeIndex >= slides.length - loopedSlides) {
    newIndex = -slides.length + activeIndex + loopedSlides;
    newIndex += loopedSlides;
    const slideChanged = swiper.slideTo(newIndex, 0, false, true);
    if (slideChanged && diff !== 0) {
      swiper.setTranslate((rtl ? -swiper.translate : swiper.translate) - diff);
    }
  }
  swiper.allowSlidePrev = allowSlidePrev;
  swiper.allowSlideNext = allowSlideNext;
  swiper.emit("loopFix");
}
function loopDestroy() {
  const swiper = this;
  const {
    $wrapperEl,
    params,
    slides
  } = swiper;
  $wrapperEl.children(`.${params.slideClass}.${params.slideDuplicateClass},.${params.slideClass}.${params.slideBlankClass}`).remove();
  slides.removeAttr("data-swiper-slide-index");
}
function setGrabCursor(moving) {
  const swiper = this;
  if (swiper.support.touch || !swiper.params.simulateTouch || swiper.params.watchOverflow && swiper.isLocked || swiper.params.cssMode)
    return;
  const el = swiper.params.touchEventsTarget === "container" ? swiper.el : swiper.wrapperEl;
  el.style.cursor = "move";
  el.style.cursor = moving ? "-webkit-grabbing" : "-webkit-grab";
  el.style.cursor = moving ? "-moz-grabbin" : "-moz-grab";
  el.style.cursor = moving ? "grabbing" : "grab";
}
function unsetGrabCursor() {
  const swiper = this;
  if (swiper.support.touch || swiper.params.watchOverflow && swiper.isLocked || swiper.params.cssMode) {
    return;
  }
  swiper[swiper.params.touchEventsTarget === "container" ? "el" : "wrapperEl"].style.cursor = "";
}
function closestElement(selector, base2 = this) {
  function __closestFrom(el) {
    if (!el || el === getDocument() || el === getWindow())
      return null;
    if (el.assignedSlot)
      el = el.assignedSlot;
    const found = el.closest(selector);
    return found || __closestFrom(el.getRootNode().host);
  }
  return __closestFrom(base2);
}
function onTouchStart(event) {
  const swiper = this;
  const document2 = getDocument();
  const window2 = getWindow();
  const data = swiper.touchEventsData;
  const {
    params,
    touches,
    enabled
  } = swiper;
  if (!enabled)
    return;
  if (swiper.animating && params.preventInteractionOnTransition) {
    return;
  }
  if (!swiper.animating && params.cssMode && params.loop) {
    swiper.loopFix();
  }
  let e = event;
  if (e.originalEvent)
    e = e.originalEvent;
  let $targetEl = $(e.target);
  if (params.touchEventsTarget === "wrapper") {
    if (!$targetEl.closest(swiper.wrapperEl).length)
      return;
  }
  data.isTouchEvent = e.type === "touchstart";
  if (!data.isTouchEvent && "which" in e && e.which === 3)
    return;
  if (!data.isTouchEvent && "button" in e && e.button > 0)
    return;
  if (data.isTouched && data.isMoved)
    return;
  const swipingClassHasValue = !!params.noSwipingClass && params.noSwipingClass !== "";
  if (swipingClassHasValue && e.target && e.target.shadowRoot && event.path && event.path[0]) {
    $targetEl = $(event.path[0]);
  }
  const noSwipingSelector = params.noSwipingSelector ? params.noSwipingSelector : `.${params.noSwipingClass}`;
  const isTargetShadow = !!(e.target && e.target.shadowRoot);
  if (params.noSwiping && (isTargetShadow ? closestElement(noSwipingSelector, e.target) : $targetEl.closest(noSwipingSelector)[0])) {
    swiper.allowClick = true;
    return;
  }
  if (params.swipeHandler) {
    if (!$targetEl.closest(params.swipeHandler)[0])
      return;
  }
  touches.currentX = e.type === "touchstart" ? e.targetTouches[0].pageX : e.pageX;
  touches.currentY = e.type === "touchstart" ? e.targetTouches[0].pageY : e.pageY;
  const startX = touches.currentX;
  const startY = touches.currentY;
  const edgeSwipeDetection = params.edgeSwipeDetection || params.iOSEdgeSwipeDetection;
  const edgeSwipeThreshold = params.edgeSwipeThreshold || params.iOSEdgeSwipeThreshold;
  if (edgeSwipeDetection && (startX <= edgeSwipeThreshold || startX >= window2.innerWidth - edgeSwipeThreshold)) {
    if (edgeSwipeDetection === "prevent") {
      event.preventDefault();
    } else {
      return;
    }
  }
  Object.assign(data, {
    isTouched: true,
    isMoved: false,
    allowTouchCallbacks: true,
    isScrolling: void 0,
    startMoving: void 0
  });
  touches.startX = startX;
  touches.startY = startY;
  data.touchStartTime = now();
  swiper.allowClick = true;
  swiper.updateSize();
  swiper.swipeDirection = void 0;
  if (params.threshold > 0)
    data.allowThresholdMove = false;
  if (e.type !== "touchstart") {
    let preventDefault = true;
    if ($targetEl.is(data.focusableElements))
      preventDefault = false;
    if (document2.activeElement && $(document2.activeElement).is(data.focusableElements) && document2.activeElement !== $targetEl[0]) {
      document2.activeElement.blur();
    }
    const shouldPreventDefault = preventDefault && swiper.allowTouchMove && params.touchStartPreventDefault;
    if ((params.touchStartForcePreventDefault || shouldPreventDefault) && !$targetEl[0].isContentEditable) {
      e.preventDefault();
    }
  }
  swiper.emit("touchStart", e);
}
function onTouchMove(event) {
  const document2 = getDocument();
  const swiper = this;
  const data = swiper.touchEventsData;
  const {
    params,
    touches,
    rtlTranslate: rtl,
    enabled
  } = swiper;
  if (!enabled)
    return;
  let e = event;
  if (e.originalEvent)
    e = e.originalEvent;
  if (!data.isTouched) {
    if (data.startMoving && data.isScrolling) {
      swiper.emit("touchMoveOpposite", e);
    }
    return;
  }
  if (data.isTouchEvent && e.type !== "touchmove")
    return;
  const targetTouch = e.type === "touchmove" && e.targetTouches && (e.targetTouches[0] || e.changedTouches[0]);
  const pageX = e.type === "touchmove" ? targetTouch.pageX : e.pageX;
  const pageY = e.type === "touchmove" ? targetTouch.pageY : e.pageY;
  if (e.preventedByNestedSwiper) {
    touches.startX = pageX;
    touches.startY = pageY;
    return;
  }
  if (!swiper.allowTouchMove) {
    swiper.allowClick = false;
    if (data.isTouched) {
      Object.assign(touches, {
        startX: pageX,
        startY: pageY,
        currentX: pageX,
        currentY: pageY
      });
      data.touchStartTime = now();
    }
    return;
  }
  if (data.isTouchEvent && params.touchReleaseOnEdges && !params.loop) {
    if (swiper.isVertical()) {
      if (pageY < touches.startY && swiper.translate <= swiper.maxTranslate() || pageY > touches.startY && swiper.translate >= swiper.minTranslate()) {
        data.isTouched = false;
        data.isMoved = false;
        return;
      }
    } else if (pageX < touches.startX && swiper.translate <= swiper.maxTranslate() || pageX > touches.startX && swiper.translate >= swiper.minTranslate()) {
      return;
    }
  }
  if (data.isTouchEvent && document2.activeElement) {
    if (e.target === document2.activeElement && $(e.target).is(data.focusableElements)) {
      data.isMoved = true;
      swiper.allowClick = false;
      return;
    }
  }
  if (data.allowTouchCallbacks) {
    swiper.emit("touchMove", e);
  }
  if (e.targetTouches && e.targetTouches.length > 1)
    return;
  touches.currentX = pageX;
  touches.currentY = pageY;
  const diffX = touches.currentX - touches.startX;
  const diffY = touches.currentY - touches.startY;
  if (swiper.params.threshold && Math.sqrt(diffX ** 2 + diffY ** 2) < swiper.params.threshold)
    return;
  if (typeof data.isScrolling === "undefined") {
    let touchAngle;
    if (swiper.isHorizontal() && touches.currentY === touches.startY || swiper.isVertical() && touches.currentX === touches.startX) {
      data.isScrolling = false;
    } else {
      if (diffX * diffX + diffY * diffY >= 25) {
        touchAngle = Math.atan2(Math.abs(diffY), Math.abs(diffX)) * 180 / Math.PI;
        data.isScrolling = swiper.isHorizontal() ? touchAngle > params.touchAngle : 90 - touchAngle > params.touchAngle;
      }
    }
  }
  if (data.isScrolling) {
    swiper.emit("touchMoveOpposite", e);
  }
  if (typeof data.startMoving === "undefined") {
    if (touches.currentX !== touches.startX || touches.currentY !== touches.startY) {
      data.startMoving = true;
    }
  }
  if (data.isScrolling) {
    data.isTouched = false;
    return;
  }
  if (!data.startMoving) {
    return;
  }
  swiper.allowClick = false;
  if (!params.cssMode && e.cancelable) {
    e.preventDefault();
  }
  if (params.touchMoveStopPropagation && !params.nested) {
    e.stopPropagation();
  }
  if (!data.isMoved) {
    if (params.loop && !params.cssMode) {
      swiper.loopFix();
    }
    data.startTranslate = swiper.getTranslate();
    swiper.setTransition(0);
    if (swiper.animating) {
      swiper.$wrapperEl.trigger("webkitTransitionEnd transitionend");
    }
    data.allowMomentumBounce = false;
    if (params.grabCursor && (swiper.allowSlideNext === true || swiper.allowSlidePrev === true)) {
      swiper.setGrabCursor(true);
    }
    swiper.emit("sliderFirstMove", e);
  }
  swiper.emit("sliderMove", e);
  data.isMoved = true;
  let diff = swiper.isHorizontal() ? diffX : diffY;
  touches.diff = diff;
  diff *= params.touchRatio;
  if (rtl)
    diff = -diff;
  swiper.swipeDirection = diff > 0 ? "prev" : "next";
  data.currentTranslate = diff + data.startTranslate;
  let disableParentSwiper = true;
  let resistanceRatio = params.resistanceRatio;
  if (params.touchReleaseOnEdges) {
    resistanceRatio = 0;
  }
  if (diff > 0 && data.currentTranslate > swiper.minTranslate()) {
    disableParentSwiper = false;
    if (params.resistance)
      data.currentTranslate = swiper.minTranslate() - 1 + (-swiper.minTranslate() + data.startTranslate + diff) ** resistanceRatio;
  } else if (diff < 0 && data.currentTranslate < swiper.maxTranslate()) {
    disableParentSwiper = false;
    if (params.resistance)
      data.currentTranslate = swiper.maxTranslate() + 1 - (swiper.maxTranslate() - data.startTranslate - diff) ** resistanceRatio;
  }
  if (disableParentSwiper) {
    e.preventedByNestedSwiper = true;
  }
  if (!swiper.allowSlideNext && swiper.swipeDirection === "next" && data.currentTranslate < data.startTranslate) {
    data.currentTranslate = data.startTranslate;
  }
  if (!swiper.allowSlidePrev && swiper.swipeDirection === "prev" && data.currentTranslate > data.startTranslate) {
    data.currentTranslate = data.startTranslate;
  }
  if (!swiper.allowSlidePrev && !swiper.allowSlideNext) {
    data.currentTranslate = data.startTranslate;
  }
  if (params.threshold > 0) {
    if (Math.abs(diff) > params.threshold || data.allowThresholdMove) {
      if (!data.allowThresholdMove) {
        data.allowThresholdMove = true;
        touches.startX = touches.currentX;
        touches.startY = touches.currentY;
        data.currentTranslate = data.startTranslate;
        touches.diff = swiper.isHorizontal() ? touches.currentX - touches.startX : touches.currentY - touches.startY;
        return;
      }
    } else {
      data.currentTranslate = data.startTranslate;
      return;
    }
  }
  if (!params.followFinger || params.cssMode)
    return;
  if (params.freeMode && params.freeMode.enabled && swiper.freeMode || params.watchSlidesProgress) {
    swiper.updateActiveIndex();
    swiper.updateSlidesClasses();
  }
  if (swiper.params.freeMode && params.freeMode.enabled && swiper.freeMode) {
    swiper.freeMode.onTouchMove();
  }
  swiper.updateProgress(data.currentTranslate);
  swiper.setTranslate(data.currentTranslate);
}
function onTouchEnd(event) {
  const swiper = this;
  const data = swiper.touchEventsData;
  const {
    params,
    touches,
    rtlTranslate: rtl,
    slidesGrid,
    enabled
  } = swiper;
  if (!enabled)
    return;
  let e = event;
  if (e.originalEvent)
    e = e.originalEvent;
  if (data.allowTouchCallbacks) {
    swiper.emit("touchEnd", e);
  }
  data.allowTouchCallbacks = false;
  if (!data.isTouched) {
    if (data.isMoved && params.grabCursor) {
      swiper.setGrabCursor(false);
    }
    data.isMoved = false;
    data.startMoving = false;
    return;
  }
  if (params.grabCursor && data.isMoved && data.isTouched && (swiper.allowSlideNext === true || swiper.allowSlidePrev === true)) {
    swiper.setGrabCursor(false);
  }
  const touchEndTime = now();
  const timeDiff = touchEndTime - data.touchStartTime;
  if (swiper.allowClick) {
    const pathTree = e.path || e.composedPath && e.composedPath();
    swiper.updateClickedSlide(pathTree && pathTree[0] || e.target);
    swiper.emit("tap click", e);
    if (timeDiff < 300 && touchEndTime - data.lastClickTime < 300) {
      swiper.emit("doubleTap doubleClick", e);
    }
  }
  data.lastClickTime = now();
  nextTick(() => {
    if (!swiper.destroyed)
      swiper.allowClick = true;
  });
  if (!data.isTouched || !data.isMoved || !swiper.swipeDirection || touches.diff === 0 || data.currentTranslate === data.startTranslate) {
    data.isTouched = false;
    data.isMoved = false;
    data.startMoving = false;
    return;
  }
  data.isTouched = false;
  data.isMoved = false;
  data.startMoving = false;
  let currentPos;
  if (params.followFinger) {
    currentPos = rtl ? swiper.translate : -swiper.translate;
  } else {
    currentPos = -data.currentTranslate;
  }
  if (params.cssMode) {
    return;
  }
  if (swiper.params.freeMode && params.freeMode.enabled) {
    swiper.freeMode.onTouchEnd({
      currentPos
    });
    return;
  }
  let stopIndex = 0;
  let groupSize = swiper.slidesSizesGrid[0];
  for (let i = 0; i < slidesGrid.length; i += i < params.slidesPerGroupSkip ? 1 : params.slidesPerGroup) {
    const increment2 = i < params.slidesPerGroupSkip - 1 ? 1 : params.slidesPerGroup;
    if (typeof slidesGrid[i + increment2] !== "undefined") {
      if (currentPos >= slidesGrid[i] && currentPos < slidesGrid[i + increment2]) {
        stopIndex = i;
        groupSize = slidesGrid[i + increment2] - slidesGrid[i];
      }
    } else if (currentPos >= slidesGrid[i]) {
      stopIndex = i;
      groupSize = slidesGrid[slidesGrid.length - 1] - slidesGrid[slidesGrid.length - 2];
    }
  }
  const ratio = (currentPos - slidesGrid[stopIndex]) / groupSize;
  const increment = stopIndex < params.slidesPerGroupSkip - 1 ? 1 : params.slidesPerGroup;
  if (timeDiff > params.longSwipesMs) {
    if (!params.longSwipes) {
      swiper.slideTo(swiper.activeIndex);
      return;
    }
    if (swiper.swipeDirection === "next") {
      if (ratio >= params.longSwipesRatio)
        swiper.slideTo(stopIndex + increment);
      else
        swiper.slideTo(stopIndex);
    }
    if (swiper.swipeDirection === "prev") {
      if (ratio > 1 - params.longSwipesRatio)
        swiper.slideTo(stopIndex + increment);
      else
        swiper.slideTo(stopIndex);
    }
  } else {
    if (!params.shortSwipes) {
      swiper.slideTo(swiper.activeIndex);
      return;
    }
    const isNavButtonTarget = swiper.navigation && (e.target === swiper.navigation.nextEl || e.target === swiper.navigation.prevEl);
    if (!isNavButtonTarget) {
      if (swiper.swipeDirection === "next") {
        swiper.slideTo(stopIndex + increment);
      }
      if (swiper.swipeDirection === "prev") {
        swiper.slideTo(stopIndex);
      }
    } else if (e.target === swiper.navigation.nextEl) {
      swiper.slideTo(stopIndex + increment);
    } else {
      swiper.slideTo(stopIndex);
    }
  }
}
function onResize() {
  const swiper = this;
  const {
    params,
    el
  } = swiper;
  if (el && el.offsetWidth === 0)
    return;
  if (params.breakpoints) {
    swiper.setBreakpoint();
  }
  const {
    allowSlideNext,
    allowSlidePrev,
    snapGrid
  } = swiper;
  swiper.allowSlideNext = true;
  swiper.allowSlidePrev = true;
  swiper.updateSize();
  swiper.updateSlides();
  swiper.updateSlidesClasses();
  if ((params.slidesPerView === "auto" || params.slidesPerView > 1) && swiper.isEnd && !swiper.isBeginning && !swiper.params.centeredSlides) {
    swiper.slideTo(swiper.slides.length - 1, 0, false, true);
  } else {
    swiper.slideTo(swiper.activeIndex, 0, false, true);
  }
  if (swiper.autoplay && swiper.autoplay.running && swiper.autoplay.paused) {
    swiper.autoplay.run();
  }
  swiper.allowSlidePrev = allowSlidePrev;
  swiper.allowSlideNext = allowSlideNext;
  if (swiper.params.watchOverflow && snapGrid !== swiper.snapGrid) {
    swiper.checkOverflow();
  }
}
function onClick(e) {
  const swiper = this;
  if (!swiper.enabled)
    return;
  if (!swiper.allowClick) {
    if (swiper.params.preventClicks)
      e.preventDefault();
    if (swiper.params.preventClicksPropagation && swiper.animating) {
      e.stopPropagation();
      e.stopImmediatePropagation();
    }
  }
}
function onScroll() {
  const swiper = this;
  const {
    wrapperEl,
    rtlTranslate,
    enabled
  } = swiper;
  if (!enabled)
    return;
  swiper.previousTranslate = swiper.translate;
  if (swiper.isHorizontal()) {
    swiper.translate = -wrapperEl.scrollLeft;
  } else {
    swiper.translate = -wrapperEl.scrollTop;
  }
  if (swiper.translate === -0)
    swiper.translate = 0;
  swiper.updateActiveIndex();
  swiper.updateSlidesClasses();
  let newProgress;
  const translatesDiff = swiper.maxTranslate() - swiper.minTranslate();
  if (translatesDiff === 0) {
    newProgress = 0;
  } else {
    newProgress = (swiper.translate - swiper.minTranslate()) / translatesDiff;
  }
  if (newProgress !== swiper.progress) {
    swiper.updateProgress(rtlTranslate ? -swiper.translate : swiper.translate);
  }
  swiper.emit("setTranslate", swiper.translate, false);
}
function dummyEventListener() {
}
function attachEvents() {
  const swiper = this;
  const document2 = getDocument();
  const {
    params,
    support: support2
  } = swiper;
  swiper.onTouchStart = onTouchStart.bind(swiper);
  swiper.onTouchMove = onTouchMove.bind(swiper);
  swiper.onTouchEnd = onTouchEnd.bind(swiper);
  if (params.cssMode) {
    swiper.onScroll = onScroll.bind(swiper);
  }
  swiper.onClick = onClick.bind(swiper);
  if (support2.touch && !dummyEventAttached) {
    document2.addEventListener("touchstart", dummyEventListener);
    dummyEventAttached = true;
  }
  events(swiper, "on");
}
function detachEvents() {
  const swiper = this;
  events(swiper, "off");
}
function setBreakpoint() {
  const swiper = this;
  const {
    activeIndex,
    initialized,
    loopedSlides = 0,
    params,
    $el
  } = swiper;
  const breakpoints2 = params.breakpoints;
  if (!breakpoints2 || breakpoints2 && Object.keys(breakpoints2).length === 0)
    return;
  const breakpoint = swiper.getBreakpoint(breakpoints2, swiper.params.breakpointsBase, swiper.el);
  if (!breakpoint || swiper.currentBreakpoint === breakpoint)
    return;
  const breakpointOnlyParams = breakpoint in breakpoints2 ? breakpoints2[breakpoint] : void 0;
  const breakpointParams = breakpointOnlyParams || swiper.originalParams;
  const wasMultiRow = isGridEnabled(swiper, params);
  const isMultiRow = isGridEnabled(swiper, breakpointParams);
  const wasEnabled = params.enabled;
  if (wasMultiRow && !isMultiRow) {
    $el.removeClass(`${params.containerModifierClass}grid ${params.containerModifierClass}grid-column`);
    swiper.emitContainerClasses();
  } else if (!wasMultiRow && isMultiRow) {
    $el.addClass(`${params.containerModifierClass}grid`);
    if (breakpointParams.grid.fill && breakpointParams.grid.fill === "column" || !breakpointParams.grid.fill && params.grid.fill === "column") {
      $el.addClass(`${params.containerModifierClass}grid-column`);
    }
    swiper.emitContainerClasses();
  }
  const directionChanged = breakpointParams.direction && breakpointParams.direction !== params.direction;
  const needsReLoop = params.loop && (breakpointParams.slidesPerView !== params.slidesPerView || directionChanged);
  if (directionChanged && initialized) {
    swiper.changeDirection();
  }
  extend$1(swiper.params, breakpointParams);
  const isEnabled = swiper.params.enabled;
  Object.assign(swiper, {
    allowTouchMove: swiper.params.allowTouchMove,
    allowSlideNext: swiper.params.allowSlideNext,
    allowSlidePrev: swiper.params.allowSlidePrev
  });
  if (wasEnabled && !isEnabled) {
    swiper.disable();
  } else if (!wasEnabled && isEnabled) {
    swiper.enable();
  }
  swiper.currentBreakpoint = breakpoint;
  swiper.emit("_beforeBreakpoint", breakpointParams);
  if (needsReLoop && initialized) {
    swiper.loopDestroy();
    swiper.loopCreate();
    swiper.updateSlides();
    swiper.slideTo(activeIndex - loopedSlides + swiper.loopedSlides, 0, false);
  }
  swiper.emit("breakpoint", breakpointParams);
}
function getBreakpoint(breakpoints2, base2 = "window", containerEl) {
  if (!breakpoints2 || base2 === "container" && !containerEl)
    return void 0;
  let breakpoint = false;
  const window2 = getWindow();
  const currentHeight = base2 === "window" ? window2.innerHeight : containerEl.clientHeight;
  const points = Object.keys(breakpoints2).map((point) => {
    if (typeof point === "string" && point.indexOf("@") === 0) {
      const minRatio = parseFloat(point.substr(1));
      const value = currentHeight * minRatio;
      return {
        value,
        point
      };
    }
    return {
      value: point,
      point
    };
  });
  points.sort((a, b) => parseInt(a.value, 10) - parseInt(b.value, 10));
  for (let i = 0; i < points.length; i += 1) {
    const {
      point,
      value
    } = points[i];
    if (base2 === "window") {
      if (window2.matchMedia(`(min-width: ${value}px)`).matches) {
        breakpoint = point;
      }
    } else if (value <= containerEl.clientWidth) {
      breakpoint = point;
    }
  }
  return breakpoint || "max";
}
function prepareClasses(entries, prefix) {
  const resultClasses = [];
  entries.forEach((item) => {
    if (typeof item === "object") {
      Object.keys(item).forEach((classNames) => {
        if (item[classNames]) {
          resultClasses.push(prefix + classNames);
        }
      });
    } else if (typeof item === "string") {
      resultClasses.push(prefix + item);
    }
  });
  return resultClasses;
}
function addClasses() {
  const swiper = this;
  const {
    classNames,
    params,
    rtl,
    $el,
    device,
    support: support2
  } = swiper;
  const suffixes = prepareClasses(["initialized", params.direction, {
    "pointer-events": !support2.touch
  }, {
    "free-mode": swiper.params.freeMode && params.freeMode.enabled
  }, {
    "autoheight": params.autoHeight
  }, {
    "rtl": rtl
  }, {
    "grid": params.grid && params.grid.rows > 1
  }, {
    "grid-column": params.grid && params.grid.rows > 1 && params.grid.fill === "column"
  }, {
    "android": device.android
  }, {
    "ios": device.ios
  }, {
    "css-mode": params.cssMode
  }, {
    "centered": params.cssMode && params.centeredSlides
  }], params.containerModifierClass);
  classNames.push(...suffixes);
  $el.addClass([...classNames].join(" "));
  swiper.emitContainerClasses();
}
function removeClasses() {
  const swiper = this;
  const {
    $el,
    classNames
  } = swiper;
  $el.removeClass(classNames.join(" "));
  swiper.emitContainerClasses();
}
function loadImage(imageEl, src2, srcset, sizes, checkForComplete, callback) {
  const window2 = getWindow();
  let image;
  function onReady() {
    if (callback)
      callback();
  }
  const isPicture = $(imageEl).parent("picture")[0];
  if (!isPicture && (!imageEl.complete || !checkForComplete)) {
    if (src2) {
      image = new window2.Image();
      image.onload = onReady;
      image.onerror = onReady;
      if (sizes) {
        image.sizes = sizes;
      }
      if (srcset) {
        image.srcset = srcset;
      }
      if (src2) {
        image.src = src2;
      }
    } else {
      onReady();
    }
  } else {
    onReady();
  }
}
function preloadImages() {
  const swiper = this;
  swiper.imagesToLoad = swiper.$el.find("img");
  function onReady() {
    if (typeof swiper === "undefined" || swiper === null || !swiper || swiper.destroyed)
      return;
    if (swiper.imagesLoaded !== void 0)
      swiper.imagesLoaded += 1;
    if (swiper.imagesLoaded === swiper.imagesToLoad.length) {
      if (swiper.params.updateOnImagesReady)
        swiper.update();
      swiper.emit("imagesReady");
    }
  }
  for (let i = 0; i < swiper.imagesToLoad.length; i += 1) {
    const imageEl = swiper.imagesToLoad[i];
    swiper.loadImage(imageEl, imageEl.currentSrc || imageEl.getAttribute("src"), imageEl.srcset || imageEl.getAttribute("srcset"), imageEl.sizes || imageEl.getAttribute("sizes"), true, onReady);
  }
}
function checkOverflow() {
  const swiper = this;
  const {
    isLocked: wasLocked,
    params
  } = swiper;
  const {
    slidesOffsetBefore
  } = params;
  if (slidesOffsetBefore) {
    const lastSlideIndex = swiper.slides.length - 1;
    const lastSlideRightEdge = swiper.slidesGrid[lastSlideIndex] + swiper.slidesSizesGrid[lastSlideIndex] + slidesOffsetBefore * 2;
    swiper.isLocked = swiper.size > lastSlideRightEdge;
  } else {
    swiper.isLocked = swiper.snapGrid.length === 1;
  }
  if (params.allowSlideNext === true) {
    swiper.allowSlideNext = !swiper.isLocked;
  }
  if (params.allowSlidePrev === true) {
    swiper.allowSlidePrev = !swiper.isLocked;
  }
  if (wasLocked && wasLocked !== swiper.isLocked) {
    swiper.isEnd = false;
  }
  if (wasLocked !== swiper.isLocked) {
    swiper.emit(swiper.isLocked ? "lock" : "unlock");
  }
}
function moduleExtendParams(params, allModulesParams) {
  return function extendParams(obj = {}) {
    const moduleParamName = Object.keys(obj)[0];
    const moduleParams = obj[moduleParamName];
    if (typeof moduleParams !== "object" || moduleParams === null) {
      extend$1(allModulesParams, obj);
      return;
    }
    if (["navigation", "pagination", "scrollbar"].indexOf(moduleParamName) >= 0 && params[moduleParamName] === true) {
      params[moduleParamName] = {
        auto: true
      };
    }
    if (!(moduleParamName in params && "enabled" in moduleParams)) {
      extend$1(allModulesParams, obj);
      return;
    }
    if (params[moduleParamName] === true) {
      params[moduleParamName] = {
        enabled: true
      };
    }
    if (typeof params[moduleParamName] === "object" && !("enabled" in params[moduleParamName])) {
      params[moduleParamName].enabled = true;
    }
    if (!params[moduleParamName])
      params[moduleParamName] = {
        enabled: false
      };
    extend$1(allModulesParams, obj);
  };
}
function createElementIfNotDefined(swiper, originalParams, params, checkProps) {
  const document2 = getDocument();
  if (swiper.params.createElements) {
    Object.keys(checkProps).forEach((key) => {
      if (!params[key] && params.auto === true) {
        let element = swiper.$el.children(`.${checkProps[key]}`)[0];
        if (!element) {
          element = document2.createElement("div");
          element.className = checkProps[key];
          swiper.$el.append(element);
        }
        params[key] = element;
        originalParams[key] = element;
      }
    });
  }
  return params;
}
function Navigation({
  swiper,
  extendParams,
  on: on2,
  emit
}) {
  extendParams({
    navigation: {
      nextEl: null,
      prevEl: null,
      hideOnClick: false,
      disabledClass: "swiper-button-disabled",
      hiddenClass: "swiper-button-hidden",
      lockClass: "swiper-button-lock"
    }
  });
  swiper.navigation = {
    nextEl: null,
    $nextEl: null,
    prevEl: null,
    $prevEl: null
  };
  function getEl(el) {
    let $el;
    if (el) {
      $el = $(el);
      if (swiper.params.uniqueNavElements && typeof el === "string" && $el.length > 1 && swiper.$el.find(el).length === 1) {
        $el = swiper.$el.find(el);
      }
    }
    return $el;
  }
  function toggleEl($el, disabled) {
    const params = swiper.params.navigation;
    if ($el && $el.length > 0) {
      $el[disabled ? "addClass" : "removeClass"](params.disabledClass);
      if ($el[0] && $el[0].tagName === "BUTTON")
        $el[0].disabled = disabled;
      if (swiper.params.watchOverflow && swiper.enabled) {
        $el[swiper.isLocked ? "addClass" : "removeClass"](params.lockClass);
      }
    }
  }
  function update22() {
    if (swiper.params.loop)
      return;
    const {
      $nextEl,
      $prevEl
    } = swiper.navigation;
    toggleEl($prevEl, swiper.isBeginning && !swiper.params.rewind);
    toggleEl($nextEl, swiper.isEnd && !swiper.params.rewind);
  }
  function onPrevClick(e) {
    e.preventDefault();
    if (swiper.isBeginning && !swiper.params.loop && !swiper.params.rewind)
      return;
    swiper.slidePrev();
  }
  function onNextClick(e) {
    e.preventDefault();
    if (swiper.isEnd && !swiper.params.loop && !swiper.params.rewind)
      return;
    swiper.slideNext();
  }
  function init2() {
    const params = swiper.params.navigation;
    swiper.params.navigation = createElementIfNotDefined(swiper, swiper.originalParams.navigation, swiper.params.navigation, {
      nextEl: "swiper-button-next",
      prevEl: "swiper-button-prev"
    });
    if (!(params.nextEl || params.prevEl))
      return;
    const $nextEl = getEl(params.nextEl);
    const $prevEl = getEl(params.prevEl);
    if ($nextEl && $nextEl.length > 0) {
      $nextEl.on("click", onNextClick);
    }
    if ($prevEl && $prevEl.length > 0) {
      $prevEl.on("click", onPrevClick);
    }
    Object.assign(swiper.navigation, {
      $nextEl,
      nextEl: $nextEl && $nextEl[0],
      $prevEl,
      prevEl: $prevEl && $prevEl[0]
    });
    if (!swiper.enabled) {
      if ($nextEl)
        $nextEl.addClass(params.lockClass);
      if ($prevEl)
        $prevEl.addClass(params.lockClass);
    }
  }
  function destroy() {
    const {
      $nextEl,
      $prevEl
    } = swiper.navigation;
    if ($nextEl && $nextEl.length) {
      $nextEl.off("click", onNextClick);
      $nextEl.removeClass(swiper.params.navigation.disabledClass);
    }
    if ($prevEl && $prevEl.length) {
      $prevEl.off("click", onPrevClick);
      $prevEl.removeClass(swiper.params.navigation.disabledClass);
    }
  }
  on2("init", () => {
    init2();
    update22();
  });
  on2("toEdge fromEdge lock unlock", () => {
    update22();
  });
  on2("destroy", () => {
    destroy();
  });
  on2("enable disable", () => {
    const {
      $nextEl,
      $prevEl
    } = swiper.navigation;
    if ($nextEl) {
      $nextEl[swiper.enabled ? "removeClass" : "addClass"](swiper.params.navigation.lockClass);
    }
    if ($prevEl) {
      $prevEl[swiper.enabled ? "removeClass" : "addClass"](swiper.params.navigation.lockClass);
    }
  });
  on2("click", (_s, e) => {
    const {
      $nextEl,
      $prevEl
    } = swiper.navigation;
    const targetEl = e.target;
    if (swiper.params.navigation.hideOnClick && !$(targetEl).is($prevEl) && !$(targetEl).is($nextEl)) {
      if (swiper.pagination && swiper.params.pagination && swiper.params.pagination.clickable && (swiper.pagination.el === targetEl || swiper.pagination.el.contains(targetEl)))
        return;
      let isHidden;
      if ($nextEl) {
        isHidden = $nextEl.hasClass(swiper.params.navigation.hiddenClass);
      } else if ($prevEl) {
        isHidden = $prevEl.hasClass(swiper.params.navigation.hiddenClass);
      }
      if (isHidden === true) {
        emit("navigationShow");
      } else {
        emit("navigationHide");
      }
      if ($nextEl) {
        $nextEl.toggleClass(swiper.params.navigation.hiddenClass);
      }
      if ($prevEl) {
        $prevEl.toggleClass(swiper.params.navigation.hiddenClass);
      }
    }
  });
  Object.assign(swiper.navigation, {
    update: update22,
    init: init2,
    destroy
  });
}
function classesToSelector(classes2 = "") {
  return `.${classes2.trim().replace(/([\.:!\/])/g, "\\$1").replace(/ /g, ".")}`;
}
function Pagination({
  swiper,
  extendParams,
  on: on2,
  emit
}) {
  const pfx = "swiper-pagination";
  extendParams({
    pagination: {
      el: null,
      bulletElement: "span",
      clickable: false,
      hideOnClick: false,
      renderBullet: null,
      renderProgressbar: null,
      renderFraction: null,
      renderCustom: null,
      progressbarOpposite: false,
      type: "bullets",
      dynamicBullets: false,
      dynamicMainBullets: 1,
      formatFractionCurrent: (number) => number,
      formatFractionTotal: (number) => number,
      bulletClass: `${pfx}-bullet`,
      bulletActiveClass: `${pfx}-bullet-active`,
      modifierClass: `${pfx}-`,
      currentClass: `${pfx}-current`,
      totalClass: `${pfx}-total`,
      hiddenClass: `${pfx}-hidden`,
      progressbarFillClass: `${pfx}-progressbar-fill`,
      progressbarOppositeClass: `${pfx}-progressbar-opposite`,
      clickableClass: `${pfx}-clickable`,
      lockClass: `${pfx}-lock`,
      horizontalClass: `${pfx}-horizontal`,
      verticalClass: `${pfx}-vertical`
    }
  });
  swiper.pagination = {
    el: null,
    $el: null,
    bullets: []
  };
  let bulletSize;
  let dynamicBulletIndex = 0;
  function isPaginationDisabled() {
    return !swiper.params.pagination.el || !swiper.pagination.el || !swiper.pagination.$el || swiper.pagination.$el.length === 0;
  }
  function setSideBullets($bulletEl, position) {
    const {
      bulletActiveClass
    } = swiper.params.pagination;
    $bulletEl[position]().addClass(`${bulletActiveClass}-${position}`)[position]().addClass(`${bulletActiveClass}-${position}-${position}`);
  }
  function update22() {
    const rtl = swiper.rtl;
    const params = swiper.params.pagination;
    if (isPaginationDisabled())
      return;
    const slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : swiper.slides.length;
    const $el = swiper.pagination.$el;
    let current;
    const total = swiper.params.loop ? Math.ceil((slidesLength - swiper.loopedSlides * 2) / swiper.params.slidesPerGroup) : swiper.snapGrid.length;
    if (swiper.params.loop) {
      current = Math.ceil((swiper.activeIndex - swiper.loopedSlides) / swiper.params.slidesPerGroup);
      if (current > slidesLength - 1 - swiper.loopedSlides * 2) {
        current -= slidesLength - swiper.loopedSlides * 2;
      }
      if (current > total - 1)
        current -= total;
      if (current < 0 && swiper.params.paginationType !== "bullets")
        current = total + current;
    } else if (typeof swiper.snapIndex !== "undefined") {
      current = swiper.snapIndex;
    } else {
      current = swiper.activeIndex || 0;
    }
    if (params.type === "bullets" && swiper.pagination.bullets && swiper.pagination.bullets.length > 0) {
      const bullets = swiper.pagination.bullets;
      let firstIndex;
      let lastIndex;
      let midIndex;
      if (params.dynamicBullets) {
        bulletSize = bullets.eq(0)[swiper.isHorizontal() ? "outerWidth" : "outerHeight"](true);
        $el.css(swiper.isHorizontal() ? "width" : "height", `${bulletSize * (params.dynamicMainBullets + 4)}px`);
        if (params.dynamicMainBullets > 1 && swiper.previousIndex !== void 0) {
          dynamicBulletIndex += current - (swiper.previousIndex - swiper.loopedSlides || 0);
          if (dynamicBulletIndex > params.dynamicMainBullets - 1) {
            dynamicBulletIndex = params.dynamicMainBullets - 1;
          } else if (dynamicBulletIndex < 0) {
            dynamicBulletIndex = 0;
          }
        }
        firstIndex = Math.max(current - dynamicBulletIndex, 0);
        lastIndex = firstIndex + (Math.min(bullets.length, params.dynamicMainBullets) - 1);
        midIndex = (lastIndex + firstIndex) / 2;
      }
      bullets.removeClass(["", "-next", "-next-next", "-prev", "-prev-prev", "-main"].map((suffix) => `${params.bulletActiveClass}${suffix}`).join(" "));
      if ($el.length > 1) {
        bullets.each((bullet) => {
          const $bullet = $(bullet);
          const bulletIndex = $bullet.index();
          if (bulletIndex === current) {
            $bullet.addClass(params.bulletActiveClass);
          }
          if (params.dynamicBullets) {
            if (bulletIndex >= firstIndex && bulletIndex <= lastIndex) {
              $bullet.addClass(`${params.bulletActiveClass}-main`);
            }
            if (bulletIndex === firstIndex) {
              setSideBullets($bullet, "prev");
            }
            if (bulletIndex === lastIndex) {
              setSideBullets($bullet, "next");
            }
          }
        });
      } else {
        const $bullet = bullets.eq(current);
        const bulletIndex = $bullet.index();
        $bullet.addClass(params.bulletActiveClass);
        if (params.dynamicBullets) {
          const $firstDisplayedBullet = bullets.eq(firstIndex);
          const $lastDisplayedBullet = bullets.eq(lastIndex);
          for (let i = firstIndex; i <= lastIndex; i += 1) {
            bullets.eq(i).addClass(`${params.bulletActiveClass}-main`);
          }
          if (swiper.params.loop) {
            if (bulletIndex >= bullets.length) {
              for (let i = params.dynamicMainBullets; i >= 0; i -= 1) {
                bullets.eq(bullets.length - i).addClass(`${params.bulletActiveClass}-main`);
              }
              bullets.eq(bullets.length - params.dynamicMainBullets - 1).addClass(`${params.bulletActiveClass}-prev`);
            } else {
              setSideBullets($firstDisplayedBullet, "prev");
              setSideBullets($lastDisplayedBullet, "next");
            }
          } else {
            setSideBullets($firstDisplayedBullet, "prev");
            setSideBullets($lastDisplayedBullet, "next");
          }
        }
      }
      if (params.dynamicBullets) {
        const dynamicBulletsLength = Math.min(bullets.length, params.dynamicMainBullets + 4);
        const bulletsOffset = (bulletSize * dynamicBulletsLength - bulletSize) / 2 - midIndex * bulletSize;
        const offsetProp = rtl ? "right" : "left";
        bullets.css(swiper.isHorizontal() ? offsetProp : "top", `${bulletsOffset}px`);
      }
    }
    if (params.type === "fraction") {
      $el.find(classesToSelector(params.currentClass)).text(params.formatFractionCurrent(current + 1));
      $el.find(classesToSelector(params.totalClass)).text(params.formatFractionTotal(total));
    }
    if (params.type === "progressbar") {
      let progressbarDirection;
      if (params.progressbarOpposite) {
        progressbarDirection = swiper.isHorizontal() ? "vertical" : "horizontal";
      } else {
        progressbarDirection = swiper.isHorizontal() ? "horizontal" : "vertical";
      }
      const scale = (current + 1) / total;
      let scaleX = 1;
      let scaleY = 1;
      if (progressbarDirection === "horizontal") {
        scaleX = scale;
      } else {
        scaleY = scale;
      }
      $el.find(classesToSelector(params.progressbarFillClass)).transform(`translate3d(0,0,0) scaleX(${scaleX}) scaleY(${scaleY})`).transition(swiper.params.speed);
    }
    if (params.type === "custom" && params.renderCustom) {
      $el.html(params.renderCustom(swiper, current + 1, total));
      emit("paginationRender", $el[0]);
    } else {
      emit("paginationUpdate", $el[0]);
    }
    if (swiper.params.watchOverflow && swiper.enabled) {
      $el[swiper.isLocked ? "addClass" : "removeClass"](params.lockClass);
    }
  }
  function render2() {
    const params = swiper.params.pagination;
    if (isPaginationDisabled())
      return;
    const slidesLength = swiper.virtual && swiper.params.virtual.enabled ? swiper.virtual.slides.length : swiper.slides.length;
    const $el = swiper.pagination.$el;
    let paginationHTML = "";
    if (params.type === "bullets") {
      let numberOfBullets = swiper.params.loop ? Math.ceil((slidesLength - swiper.loopedSlides * 2) / swiper.params.slidesPerGroup) : swiper.snapGrid.length;
      if (swiper.params.freeMode && swiper.params.freeMode.enabled && !swiper.params.loop && numberOfBullets > slidesLength) {
        numberOfBullets = slidesLength;
      }
      for (let i = 0; i < numberOfBullets; i += 1) {
        if (params.renderBullet) {
          paginationHTML += params.renderBullet.call(swiper, i, params.bulletClass);
        } else {
          paginationHTML += `<${params.bulletElement} class="${params.bulletClass}"></${params.bulletElement}>`;
        }
      }
      $el.html(paginationHTML);
      swiper.pagination.bullets = $el.find(classesToSelector(params.bulletClass));
    }
    if (params.type === "fraction") {
      if (params.renderFraction) {
        paginationHTML = params.renderFraction.call(swiper, params.currentClass, params.totalClass);
      } else {
        paginationHTML = `<span class="${params.currentClass}"></span> / <span class="${params.totalClass}"></span>`;
      }
      $el.html(paginationHTML);
    }
    if (params.type === "progressbar") {
      if (params.renderProgressbar) {
        paginationHTML = params.renderProgressbar.call(swiper, params.progressbarFillClass);
      } else {
        paginationHTML = `<span class="${params.progressbarFillClass}"></span>`;
      }
      $el.html(paginationHTML);
    }
    if (params.type !== "custom") {
      emit("paginationRender", swiper.pagination.$el[0]);
    }
  }
  function init2() {
    swiper.params.pagination = createElementIfNotDefined(swiper, swiper.originalParams.pagination, swiper.params.pagination, {
      el: "swiper-pagination"
    });
    const params = swiper.params.pagination;
    if (!params.el)
      return;
    let $el = $(params.el);
    if ($el.length === 0)
      return;
    if (swiper.params.uniqueNavElements && typeof params.el === "string" && $el.length > 1) {
      $el = swiper.$el.find(params.el);
      if ($el.length > 1) {
        $el = $el.filter((el) => {
          if ($(el).parents(".swiper")[0] !== swiper.el)
            return false;
          return true;
        });
      }
    }
    if (params.type === "bullets" && params.clickable) {
      $el.addClass(params.clickableClass);
    }
    $el.addClass(params.modifierClass + params.type);
    $el.addClass(params.modifierClass + swiper.params.direction);
    if (params.type === "bullets" && params.dynamicBullets) {
      $el.addClass(`${params.modifierClass}${params.type}-dynamic`);
      dynamicBulletIndex = 0;
      if (params.dynamicMainBullets < 1) {
        params.dynamicMainBullets = 1;
      }
    }
    if (params.type === "progressbar" && params.progressbarOpposite) {
      $el.addClass(params.progressbarOppositeClass);
    }
    if (params.clickable) {
      $el.on("click", classesToSelector(params.bulletClass), function onClick2(e) {
        e.preventDefault();
        let index2 = $(this).index() * swiper.params.slidesPerGroup;
        if (swiper.params.loop)
          index2 += swiper.loopedSlides;
        swiper.slideTo(index2);
      });
    }
    Object.assign(swiper.pagination, {
      $el,
      el: $el[0]
    });
    if (!swiper.enabled) {
      $el.addClass(params.lockClass);
    }
  }
  function destroy() {
    const params = swiper.params.pagination;
    if (isPaginationDisabled())
      return;
    const $el = swiper.pagination.$el;
    $el.removeClass(params.hiddenClass);
    $el.removeClass(params.modifierClass + params.type);
    $el.removeClass(params.modifierClass + swiper.params.direction);
    if (swiper.pagination.bullets && swiper.pagination.bullets.removeClass)
      swiper.pagination.bullets.removeClass(params.bulletActiveClass);
    if (params.clickable) {
      $el.off("click", classesToSelector(params.bulletClass));
    }
  }
  on2("init", () => {
    init2();
    render2();
    update22();
  });
  on2("activeIndexChange", () => {
    if (swiper.params.loop) {
      update22();
    } else if (typeof swiper.snapIndex === "undefined") {
      update22();
    }
  });
  on2("snapIndexChange", () => {
    if (!swiper.params.loop) {
      update22();
    }
  });
  on2("slidesLengthChange", () => {
    if (swiper.params.loop) {
      render2();
      update22();
    }
  });
  on2("snapGridLengthChange", () => {
    if (!swiper.params.loop) {
      render2();
      update22();
    }
  });
  on2("destroy", () => {
    destroy();
  });
  on2("enable disable", () => {
    const {
      $el
    } = swiper.pagination;
    if ($el) {
      $el[swiper.enabled ? "removeClass" : "addClass"](swiper.params.pagination.lockClass);
    }
  });
  on2("lock unlock", () => {
    update22();
  });
  on2("click", (_s, e) => {
    const targetEl = e.target;
    const {
      $el
    } = swiper.pagination;
    if (swiper.params.pagination.el && swiper.params.pagination.hideOnClick && $el.length > 0 && !$(targetEl).hasClass(swiper.params.pagination.bulletClass)) {
      if (swiper.navigation && (swiper.navigation.nextEl && targetEl === swiper.navigation.nextEl || swiper.navigation.prevEl && targetEl === swiper.navigation.prevEl))
        return;
      const isHidden = $el.hasClass(swiper.params.pagination.hiddenClass);
      if (isHidden === true) {
        emit("paginationShow");
      } else {
        emit("paginationHide");
      }
      $el.toggleClass(swiper.params.pagination.hiddenClass);
    }
  });
  Object.assign(swiper.pagination, {
    render: render2,
    update: update22,
    init: init2,
    destroy
  });
}
function Autoplay({
  swiper,
  extendParams,
  on: on2,
  emit
}) {
  let timeout;
  swiper.autoplay = {
    running: false,
    paused: false
  };
  extendParams({
    autoplay: {
      enabled: false,
      delay: 3e3,
      waitForTransition: true,
      disableOnInteraction: true,
      stopOnLastSlide: false,
      reverseDirection: false,
      pauseOnMouseEnter: false
    }
  });
  function run2() {
    const $activeSlideEl = swiper.slides.eq(swiper.activeIndex);
    let delay = swiper.params.autoplay.delay;
    if ($activeSlideEl.attr("data-swiper-autoplay")) {
      delay = $activeSlideEl.attr("data-swiper-autoplay") || swiper.params.autoplay.delay;
    }
    clearTimeout(timeout);
    timeout = nextTick(() => {
      let autoplayResult;
      if (swiper.params.autoplay.reverseDirection) {
        if (swiper.params.loop) {
          swiper.loopFix();
          autoplayResult = swiper.slidePrev(swiper.params.speed, true, true);
          emit("autoplay");
        } else if (!swiper.isBeginning) {
          autoplayResult = swiper.slidePrev(swiper.params.speed, true, true);
          emit("autoplay");
        } else if (!swiper.params.autoplay.stopOnLastSlide) {
          autoplayResult = swiper.slideTo(swiper.slides.length - 1, swiper.params.speed, true, true);
          emit("autoplay");
        } else {
          stop();
        }
      } else if (swiper.params.loop) {
        swiper.loopFix();
        autoplayResult = swiper.slideNext(swiper.params.speed, true, true);
        emit("autoplay");
      } else if (!swiper.isEnd) {
        autoplayResult = swiper.slideNext(swiper.params.speed, true, true);
        emit("autoplay");
      } else if (!swiper.params.autoplay.stopOnLastSlide) {
        autoplayResult = swiper.slideTo(0, swiper.params.speed, true, true);
        emit("autoplay");
      } else {
        stop();
      }
      if (swiper.params.cssMode && swiper.autoplay.running)
        run2();
      else if (autoplayResult === false) {
        run2();
      }
    }, delay);
  }
  function start() {
    if (typeof timeout !== "undefined")
      return false;
    if (swiper.autoplay.running)
      return false;
    swiper.autoplay.running = true;
    emit("autoplayStart");
    run2();
    return true;
  }
  function stop() {
    if (!swiper.autoplay.running)
      return false;
    if (typeof timeout === "undefined")
      return false;
    if (timeout) {
      clearTimeout(timeout);
      timeout = void 0;
    }
    swiper.autoplay.running = false;
    emit("autoplayStop");
    return true;
  }
  function pause(speed) {
    if (!swiper.autoplay.running)
      return;
    if (swiper.autoplay.paused)
      return;
    if (timeout)
      clearTimeout(timeout);
    swiper.autoplay.paused = true;
    if (speed === 0 || !swiper.params.autoplay.waitForTransition) {
      swiper.autoplay.paused = false;
      run2();
    } else {
      ["transitionend", "webkitTransitionEnd"].forEach((event) => {
        swiper.$wrapperEl[0].addEventListener(event, onTransitionEnd);
      });
    }
  }
  function onVisibilityChange() {
    const document2 = getDocument();
    if (document2.visibilityState === "hidden" && swiper.autoplay.running) {
      pause();
    }
    if (document2.visibilityState === "visible" && swiper.autoplay.paused) {
      run2();
      swiper.autoplay.paused = false;
    }
  }
  function onTransitionEnd(e) {
    if (!swiper || swiper.destroyed || !swiper.$wrapperEl)
      return;
    if (e.target !== swiper.$wrapperEl[0])
      return;
    ["transitionend", "webkitTransitionEnd"].forEach((event) => {
      swiper.$wrapperEl[0].removeEventListener(event, onTransitionEnd);
    });
    swiper.autoplay.paused = false;
    if (!swiper.autoplay.running) {
      stop();
    } else {
      run2();
    }
  }
  function onMouseEnter() {
    if (swiper.params.autoplay.disableOnInteraction) {
      stop();
    } else {
      pause();
    }
    ["transitionend", "webkitTransitionEnd"].forEach((event) => {
      swiper.$wrapperEl[0].removeEventListener(event, onTransitionEnd);
    });
  }
  function onMouseLeave() {
    if (swiper.params.autoplay.disableOnInteraction) {
      return;
    }
    swiper.autoplay.paused = false;
    run2();
  }
  function attachMouseEvents() {
    if (swiper.params.autoplay.pauseOnMouseEnter) {
      swiper.$el.on("mouseenter", onMouseEnter);
      swiper.$el.on("mouseleave", onMouseLeave);
    }
  }
  function detachMouseEvents() {
    swiper.$el.off("mouseenter", onMouseEnter);
    swiper.$el.off("mouseleave", onMouseLeave);
  }
  on2("init", () => {
    if (swiper.params.autoplay.enabled) {
      start();
      const document2 = getDocument();
      document2.addEventListener("visibilitychange", onVisibilityChange);
      attachMouseEvents();
    }
  });
  on2("beforeTransitionStart", (_s, speed, internal) => {
    if (swiper.autoplay.running) {
      if (internal || !swiper.params.autoplay.disableOnInteraction) {
        swiper.autoplay.pause(speed);
      } else {
        stop();
      }
    }
  });
  on2("sliderFirstMove", () => {
    if (swiper.autoplay.running) {
      if (swiper.params.autoplay.disableOnInteraction) {
        stop();
      } else {
        pause();
      }
    }
  });
  on2("touchEnd", () => {
    if (swiper.params.cssMode && swiper.autoplay.paused && !swiper.params.autoplay.disableOnInteraction) {
      run2();
    }
  });
  on2("destroy", () => {
    detachMouseEvents();
    if (swiper.autoplay.running) {
      stop();
    }
    const document2 = getDocument();
    document2.removeEventListener("visibilitychange", onVisibilityChange);
  });
  Object.assign(swiper.autoplay, {
    pause,
    run: run2,
    start,
    stop
  });
}
function isObject(o) {
  return typeof o === "object" && o !== null && o.constructor && Object.prototype.toString.call(o).slice(8, -1) === "Object";
}
function extend(target, src2) {
  const noExtend = ["__proto__", "constructor", "prototype"];
  Object.keys(src2).filter((key) => noExtend.indexOf(key) < 0).forEach((key) => {
    if (typeof target[key] === "undefined")
      target[key] = src2[key];
    else if (isObject(src2[key]) && isObject(target[key]) && Object.keys(src2[key]).length > 0) {
      if (src2[key].__swiper__)
        target[key] = src2[key];
      else
        extend(target[key], src2[key]);
    } else {
      target[key] = src2[key];
    }
  });
}
function needsNavigation(params = {}) {
  return params.navigation && typeof params.navigation.nextEl === "undefined" && typeof params.navigation.prevEl === "undefined";
}
function needsPagination(params = {}) {
  return params.pagination && typeof params.pagination.el === "undefined";
}
function needsScrollbar(params = {}) {
  return params.scrollbar && typeof params.scrollbar.el === "undefined";
}
function uniqueClasses(classNames = "") {
  const classes2 = classNames.split(" ").map((c) => c.trim()).filter((c) => !!c);
  const unique = [];
  classes2.forEach((c) => {
    if (unique.indexOf(c) < 0)
      unique.push(c);
  });
  return unique.join(" ");
}
function getParams(obj = {}) {
  const params = {
    on: {}
  };
  const passedParams = {};
  extend(params, Swiper$1.defaults);
  extend(params, Swiper$1.extendedDefaults);
  params._emitClasses = true;
  params.init = false;
  const rest = {};
  const allowedParams = paramsList.map((key) => key.replace(/_/, ""));
  Object.keys(obj).forEach((key) => {
    if (allowedParams.indexOf(key) >= 0) {
      if (isObject(obj[key])) {
        params[key] = {};
        passedParams[key] = {};
        extend(params[key], obj[key]);
        extend(passedParams[key], obj[key]);
      } else {
        params[key] = obj[key];
        passedParams[key] = obj[key];
      }
    } else if (key.search(/on[A-Z]/) === 0 && typeof obj[key] === "function") {
      params.on[`${key[2].toLowerCase()}${key.substr(3)}`] = obj[key];
    } else {
      rest[key] = obj[key];
    }
  });
  ["navigation", "pagination", "scrollbar"].forEach((key) => {
    if (params[key] === true)
      params[key] = {};
    if (params[key] === false)
      delete params[key];
  });
  return {
    params,
    passedParams,
    rest
  };
}
function initSwiper(swiperParams) {
  return new Swiper$1(swiperParams);
}
var ssrDocument, ssrWindow, Dom7, Methods, support, deviceCached, browser, eventsEmitter, update, translate, transition, slide, loop, grabCursor, dummyEventAttached, events, events$1, isGridEnabled, breakpoints, classes, images, checkOverflow$1, defaults, prototypes, extendedDefaults, Swiper$1, paramsList, Swiper, Swiper_slide, Banner;
var init_banner_f9439a17 = __esm({
  ".svelte-kit/output/server/chunks/banner-f9439a17.js"() {
    init_shims();
    init_app_171d3477();
    ssrDocument = {
      body: {},
      addEventListener() {
      },
      removeEventListener() {
      },
      activeElement: {
        blur() {
        },
        nodeName: ""
      },
      querySelector() {
        return null;
      },
      querySelectorAll() {
        return [];
      },
      getElementById() {
        return null;
      },
      createEvent() {
        return {
          initEvent() {
          }
        };
      },
      createElement() {
        return {
          children: [],
          childNodes: [],
          style: {},
          setAttribute() {
          },
          getElementsByTagName() {
            return [];
          }
        };
      },
      createElementNS() {
        return {};
      },
      importNode() {
        return null;
      },
      location: {
        hash: "",
        host: "",
        hostname: "",
        href: "",
        origin: "",
        pathname: "",
        protocol: "",
        search: ""
      }
    };
    ssrWindow = {
      document: ssrDocument,
      navigator: {
        userAgent: ""
      },
      location: {
        hash: "",
        host: "",
        hostname: "",
        href: "",
        origin: "",
        pathname: "",
        protocol: "",
        search: ""
      },
      history: {
        replaceState() {
        },
        pushState() {
        },
        go() {
        },
        back() {
        }
      },
      CustomEvent: function CustomEvent() {
        return this;
      },
      addEventListener() {
      },
      removeEventListener() {
      },
      getComputedStyle() {
        return {
          getPropertyValue() {
            return "";
          }
        };
      },
      Image() {
      },
      Date() {
      },
      screen: {},
      setTimeout() {
      },
      clearTimeout() {
      },
      matchMedia() {
        return {};
      },
      requestAnimationFrame(callback) {
        if (typeof setTimeout === "undefined") {
          callback();
          return null;
        }
        return setTimeout(callback, 0);
      },
      cancelAnimationFrame(id) {
        if (typeof setTimeout === "undefined") {
          return;
        }
        clearTimeout(id);
      }
    };
    Dom7 = class extends Array {
      constructor(items) {
        super(...items || []);
        makeReactive(this);
      }
    };
    $.fn = Dom7.prototype;
    Methods = {
      addClass,
      removeClass,
      hasClass,
      toggleClass,
      attr,
      removeAttr,
      transform,
      transition: transition$1,
      on,
      off,
      trigger,
      transitionEnd: transitionEnd$1,
      outerWidth,
      outerHeight,
      styles,
      offset,
      css: css3,
      each,
      html,
      text,
      is,
      index,
      eq,
      append,
      prepend,
      next,
      nextAll,
      prev,
      prevAll,
      parent,
      parents,
      closest,
      find,
      children,
      filter,
      remove
    };
    Object.keys(Methods).forEach((methodName) => {
      Object.defineProperty($.fn, methodName, {
        value: Methods[methodName],
        writable: true
      });
    });
    eventsEmitter = {
      on(events2, handler, priority) {
        const self2 = this;
        if (typeof handler !== "function")
          return self2;
        const method = priority ? "unshift" : "push";
        events2.split(" ").forEach((event) => {
          if (!self2.eventsListeners[event])
            self2.eventsListeners[event] = [];
          self2.eventsListeners[event][method](handler);
        });
        return self2;
      },
      once(events2, handler, priority) {
        const self2 = this;
        if (typeof handler !== "function")
          return self2;
        function onceHandler(...args) {
          self2.off(events2, onceHandler);
          if (onceHandler.__emitterProxy) {
            delete onceHandler.__emitterProxy;
          }
          handler.apply(self2, args);
        }
        onceHandler.__emitterProxy = handler;
        return self2.on(events2, onceHandler, priority);
      },
      onAny(handler, priority) {
        const self2 = this;
        if (typeof handler !== "function")
          return self2;
        const method = priority ? "unshift" : "push";
        if (self2.eventsAnyListeners.indexOf(handler) < 0) {
          self2.eventsAnyListeners[method](handler);
        }
        return self2;
      },
      offAny(handler) {
        const self2 = this;
        if (!self2.eventsAnyListeners)
          return self2;
        const index2 = self2.eventsAnyListeners.indexOf(handler);
        if (index2 >= 0) {
          self2.eventsAnyListeners.splice(index2, 1);
        }
        return self2;
      },
      off(events2, handler) {
        const self2 = this;
        if (!self2.eventsListeners)
          return self2;
        events2.split(" ").forEach((event) => {
          if (typeof handler === "undefined") {
            self2.eventsListeners[event] = [];
          } else if (self2.eventsListeners[event]) {
            self2.eventsListeners[event].forEach((eventHandler, index2) => {
              if (eventHandler === handler || eventHandler.__emitterProxy && eventHandler.__emitterProxy === handler) {
                self2.eventsListeners[event].splice(index2, 1);
              }
            });
          }
        });
        return self2;
      },
      emit(...args) {
        const self2 = this;
        if (!self2.eventsListeners)
          return self2;
        let events2;
        let data;
        let context;
        if (typeof args[0] === "string" || Array.isArray(args[0])) {
          events2 = args[0];
          data = args.slice(1, args.length);
          context = self2;
        } else {
          events2 = args[0].events;
          data = args[0].data;
          context = args[0].context || self2;
        }
        data.unshift(context);
        const eventsArray = Array.isArray(events2) ? events2 : events2.split(" ");
        eventsArray.forEach((event) => {
          if (self2.eventsAnyListeners && self2.eventsAnyListeners.length) {
            self2.eventsAnyListeners.forEach((eventHandler) => {
              eventHandler.apply(context, [event, ...data]);
            });
          }
          if (self2.eventsListeners && self2.eventsListeners[event]) {
            self2.eventsListeners[event].forEach((eventHandler) => {
              eventHandler.apply(context, data);
            });
          }
        });
        return self2;
      }
    };
    update = {
      updateSize,
      updateSlides,
      updateAutoHeight,
      updateSlidesOffset,
      updateSlidesProgress,
      updateProgress,
      updateSlidesClasses,
      updateActiveIndex,
      updateClickedSlide
    };
    translate = {
      getTranslate: getSwiperTranslate,
      setTranslate,
      minTranslate,
      maxTranslate,
      translateTo
    };
    transition = {
      setTransition,
      transitionStart,
      transitionEnd
    };
    slide = {
      slideTo,
      slideToLoop,
      slideNext,
      slidePrev,
      slideReset,
      slideToClosest,
      slideToClickedSlide
    };
    loop = {
      loopCreate,
      loopFix,
      loopDestroy
    };
    grabCursor = {
      setGrabCursor,
      unsetGrabCursor
    };
    dummyEventAttached = false;
    events = (swiper, method) => {
      const document2 = getDocument();
      const {
        params,
        touchEvents,
        el,
        wrapperEl,
        device,
        support: support2
      } = swiper;
      const capture = !!params.nested;
      const domMethod = method === "on" ? "addEventListener" : "removeEventListener";
      const swiperMethod = method;
      if (!support2.touch) {
        el[domMethod](touchEvents.start, swiper.onTouchStart, false);
        document2[domMethod](touchEvents.move, swiper.onTouchMove, capture);
        document2[domMethod](touchEvents.end, swiper.onTouchEnd, false);
      } else {
        const passiveListener = touchEvents.start === "touchstart" && support2.passiveListener && params.passiveListeners ? {
          passive: true,
          capture: false
        } : false;
        el[domMethod](touchEvents.start, swiper.onTouchStart, passiveListener);
        el[domMethod](touchEvents.move, swiper.onTouchMove, support2.passiveListener ? {
          passive: false,
          capture
        } : capture);
        el[domMethod](touchEvents.end, swiper.onTouchEnd, passiveListener);
        if (touchEvents.cancel) {
          el[domMethod](touchEvents.cancel, swiper.onTouchEnd, passiveListener);
        }
      }
      if (params.preventClicks || params.preventClicksPropagation) {
        el[domMethod]("click", swiper.onClick, true);
      }
      if (params.cssMode) {
        wrapperEl[domMethod]("scroll", swiper.onScroll);
      }
      if (params.updateOnWindowResize) {
        swiper[swiperMethod](device.ios || device.android ? "resize orientationchange observerUpdate" : "resize observerUpdate", onResize, true);
      } else {
        swiper[swiperMethod]("observerUpdate", onResize, true);
      }
    };
    events$1 = {
      attachEvents,
      detachEvents
    };
    isGridEnabled = (swiper, params) => {
      return swiper.grid && params.grid && params.grid.rows > 1;
    };
    breakpoints = {
      setBreakpoint,
      getBreakpoint
    };
    classes = {
      addClasses,
      removeClasses
    };
    images = {
      loadImage,
      preloadImages
    };
    checkOverflow$1 = {
      checkOverflow
    };
    defaults = {
      init: true,
      direction: "horizontal",
      touchEventsTarget: "wrapper",
      initialSlide: 0,
      speed: 300,
      cssMode: false,
      updateOnWindowResize: true,
      resizeObserver: true,
      nested: false,
      createElements: false,
      enabled: true,
      focusableElements: "input, select, option, textarea, button, video, label",
      width: null,
      height: null,
      preventInteractionOnTransition: false,
      userAgent: null,
      url: null,
      edgeSwipeDetection: false,
      edgeSwipeThreshold: 20,
      autoHeight: false,
      setWrapperSize: false,
      virtualTranslate: false,
      effect: "slide",
      breakpoints: void 0,
      breakpointsBase: "window",
      spaceBetween: 0,
      slidesPerView: 1,
      slidesPerGroup: 1,
      slidesPerGroupSkip: 0,
      slidesPerGroupAuto: false,
      centeredSlides: false,
      centeredSlidesBounds: false,
      slidesOffsetBefore: 0,
      slidesOffsetAfter: 0,
      normalizeSlideIndex: true,
      centerInsufficientSlides: false,
      watchOverflow: true,
      roundLengths: false,
      touchRatio: 1,
      touchAngle: 45,
      simulateTouch: true,
      shortSwipes: true,
      longSwipes: true,
      longSwipesRatio: 0.5,
      longSwipesMs: 300,
      followFinger: true,
      allowTouchMove: true,
      threshold: 0,
      touchMoveStopPropagation: false,
      touchStartPreventDefault: true,
      touchStartForcePreventDefault: false,
      touchReleaseOnEdges: false,
      uniqueNavElements: true,
      resistance: true,
      resistanceRatio: 0.85,
      watchSlidesProgress: false,
      grabCursor: false,
      preventClicks: true,
      preventClicksPropagation: true,
      slideToClickedSlide: false,
      preloadImages: true,
      updateOnImagesReady: true,
      loop: false,
      loopAdditionalSlides: 0,
      loopedSlides: null,
      loopFillGroupWithBlank: false,
      loopPreventsSlide: true,
      rewind: false,
      allowSlidePrev: true,
      allowSlideNext: true,
      swipeHandler: null,
      noSwiping: true,
      noSwipingClass: "swiper-no-swiping",
      noSwipingSelector: null,
      passiveListeners: true,
      containerModifierClass: "swiper-",
      slideClass: "swiper-slide",
      slideBlankClass: "swiper-slide-invisible-blank",
      slideActiveClass: "swiper-slide-active",
      slideDuplicateActiveClass: "swiper-slide-duplicate-active",
      slideVisibleClass: "swiper-slide-visible",
      slideDuplicateClass: "swiper-slide-duplicate",
      slideNextClass: "swiper-slide-next",
      slideDuplicateNextClass: "swiper-slide-duplicate-next",
      slidePrevClass: "swiper-slide-prev",
      slideDuplicatePrevClass: "swiper-slide-duplicate-prev",
      wrapperClass: "swiper-wrapper",
      runCallbacksOnInit: true,
      _emitClasses: false
    };
    prototypes = {
      eventsEmitter,
      update,
      translate,
      transition,
      slide,
      loop,
      grabCursor,
      events: events$1,
      breakpoints,
      checkOverflow: checkOverflow$1,
      classes,
      images
    };
    extendedDefaults = {};
    Swiper$1 = class {
      constructor(...args) {
        let el;
        let params;
        if (args.length === 1 && args[0].constructor && Object.prototype.toString.call(args[0]).slice(8, -1) === "Object") {
          params = args[0];
        } else {
          [el, params] = args;
        }
        if (!params)
          params = {};
        params = extend$1({}, params);
        if (el && !params.el)
          params.el = el;
        if (params.el && $(params.el).length > 1) {
          const swipers = [];
          $(params.el).each((containerEl) => {
            const newParams = extend$1({}, params, {
              el: containerEl
            });
            swipers.push(new Swiper$1(newParams));
          });
          return swipers;
        }
        const swiper = this;
        swiper.__swiper__ = true;
        swiper.support = getSupport();
        swiper.device = getDevice({
          userAgent: params.userAgent
        });
        swiper.browser = getBrowser();
        swiper.eventsListeners = {};
        swiper.eventsAnyListeners = [];
        swiper.modules = [...swiper.__modules__];
        if (params.modules && Array.isArray(params.modules)) {
          swiper.modules.push(...params.modules);
        }
        const allModulesParams = {};
        swiper.modules.forEach((mod) => {
          mod({
            swiper,
            extendParams: moduleExtendParams(params, allModulesParams),
            on: swiper.on.bind(swiper),
            once: swiper.once.bind(swiper),
            off: swiper.off.bind(swiper),
            emit: swiper.emit.bind(swiper)
          });
        });
        const swiperParams = extend$1({}, defaults, allModulesParams);
        swiper.params = extend$1({}, swiperParams, extendedDefaults, params);
        swiper.originalParams = extend$1({}, swiper.params);
        swiper.passedParams = extend$1({}, params);
        if (swiper.params && swiper.params.on) {
          Object.keys(swiper.params.on).forEach((eventName) => {
            swiper.on(eventName, swiper.params.on[eventName]);
          });
        }
        if (swiper.params && swiper.params.onAny) {
          swiper.onAny(swiper.params.onAny);
        }
        swiper.$ = $;
        Object.assign(swiper, {
          enabled: swiper.params.enabled,
          el,
          classNames: [],
          slides: $(),
          slidesGrid: [],
          snapGrid: [],
          slidesSizesGrid: [],
          isHorizontal() {
            return swiper.params.direction === "horizontal";
          },
          isVertical() {
            return swiper.params.direction === "vertical";
          },
          activeIndex: 0,
          realIndex: 0,
          isBeginning: true,
          isEnd: false,
          translate: 0,
          previousTranslate: 0,
          progress: 0,
          velocity: 0,
          animating: false,
          allowSlideNext: swiper.params.allowSlideNext,
          allowSlidePrev: swiper.params.allowSlidePrev,
          touchEvents: function touchEvents() {
            const touch = ["touchstart", "touchmove", "touchend", "touchcancel"];
            const desktop = ["pointerdown", "pointermove", "pointerup"];
            swiper.touchEventsTouch = {
              start: touch[0],
              move: touch[1],
              end: touch[2],
              cancel: touch[3]
            };
            swiper.touchEventsDesktop = {
              start: desktop[0],
              move: desktop[1],
              end: desktop[2]
            };
            return swiper.support.touch || !swiper.params.simulateTouch ? swiper.touchEventsTouch : swiper.touchEventsDesktop;
          }(),
          touchEventsData: {
            isTouched: void 0,
            isMoved: void 0,
            allowTouchCallbacks: void 0,
            touchStartTime: void 0,
            isScrolling: void 0,
            currentTranslate: void 0,
            startTranslate: void 0,
            allowThresholdMove: void 0,
            focusableElements: swiper.params.focusableElements,
            lastClickTime: now(),
            clickTimeout: void 0,
            velocities: [],
            allowMomentumBounce: void 0,
            isTouchEvent: void 0,
            startMoving: void 0
          },
          allowClick: true,
          allowTouchMove: swiper.params.allowTouchMove,
          touches: {
            startX: 0,
            startY: 0,
            currentX: 0,
            currentY: 0,
            diff: 0
          },
          imagesToLoad: [],
          imagesLoaded: 0
        });
        swiper.emit("_swiper");
        if (swiper.params.init) {
          swiper.init();
        }
        return swiper;
      }
      enable() {
        const swiper = this;
        if (swiper.enabled)
          return;
        swiper.enabled = true;
        if (swiper.params.grabCursor) {
          swiper.setGrabCursor();
        }
        swiper.emit("enable");
      }
      disable() {
        const swiper = this;
        if (!swiper.enabled)
          return;
        swiper.enabled = false;
        if (swiper.params.grabCursor) {
          swiper.unsetGrabCursor();
        }
        swiper.emit("disable");
      }
      setProgress(progress, speed) {
        const swiper = this;
        progress = Math.min(Math.max(progress, 0), 1);
        const min = swiper.minTranslate();
        const max = swiper.maxTranslate();
        const current = (max - min) * progress + min;
        swiper.translateTo(current, typeof speed === "undefined" ? 0 : speed);
        swiper.updateActiveIndex();
        swiper.updateSlidesClasses();
      }
      emitContainerClasses() {
        const swiper = this;
        if (!swiper.params._emitClasses || !swiper.el)
          return;
        const cls = swiper.el.className.split(" ").filter((className) => {
          return className.indexOf("swiper") === 0 || className.indexOf(swiper.params.containerModifierClass) === 0;
        });
        swiper.emit("_containerClasses", cls.join(" "));
      }
      getSlideClasses(slideEl) {
        const swiper = this;
        return slideEl.className.split(" ").filter((className) => {
          return className.indexOf("swiper-slide") === 0 || className.indexOf(swiper.params.slideClass) === 0;
        }).join(" ");
      }
      emitSlidesClasses() {
        const swiper = this;
        if (!swiper.params._emitClasses || !swiper.el)
          return;
        const updates = [];
        swiper.slides.each((slideEl) => {
          const classNames = swiper.getSlideClasses(slideEl);
          updates.push({
            slideEl,
            classNames
          });
          swiper.emit("_slideClass", slideEl, classNames);
        });
        swiper.emit("_slideClasses", updates);
      }
      slidesPerViewDynamic(view = "current", exact = false) {
        const swiper = this;
        const {
          params,
          slides,
          slidesGrid,
          slidesSizesGrid,
          size: swiperSize,
          activeIndex
        } = swiper;
        let spv = 1;
        if (params.centeredSlides) {
          let slideSize = slides[activeIndex].swiperSlideSize;
          let breakLoop;
          for (let i = activeIndex + 1; i < slides.length; i += 1) {
            if (slides[i] && !breakLoop) {
              slideSize += slides[i].swiperSlideSize;
              spv += 1;
              if (slideSize > swiperSize)
                breakLoop = true;
            }
          }
          for (let i = activeIndex - 1; i >= 0; i -= 1) {
            if (slides[i] && !breakLoop) {
              slideSize += slides[i].swiperSlideSize;
              spv += 1;
              if (slideSize > swiperSize)
                breakLoop = true;
            }
          }
        } else {
          if (view === "current") {
            for (let i = activeIndex + 1; i < slides.length; i += 1) {
              const slideInView = exact ? slidesGrid[i] + slidesSizesGrid[i] - slidesGrid[activeIndex] < swiperSize : slidesGrid[i] - slidesGrid[activeIndex] < swiperSize;
              if (slideInView) {
                spv += 1;
              }
            }
          } else {
            for (let i = activeIndex - 1; i >= 0; i -= 1) {
              const slideInView = slidesGrid[activeIndex] - slidesGrid[i] < swiperSize;
              if (slideInView) {
                spv += 1;
              }
            }
          }
        }
        return spv;
      }
      update() {
        const swiper = this;
        if (!swiper || swiper.destroyed)
          return;
        const {
          snapGrid,
          params
        } = swiper;
        if (params.breakpoints) {
          swiper.setBreakpoint();
        }
        swiper.updateSize();
        swiper.updateSlides();
        swiper.updateProgress();
        swiper.updateSlidesClasses();
        function setTranslate2() {
          const translateValue = swiper.rtlTranslate ? swiper.translate * -1 : swiper.translate;
          const newTranslate = Math.min(Math.max(translateValue, swiper.maxTranslate()), swiper.minTranslate());
          swiper.setTranslate(newTranslate);
          swiper.updateActiveIndex();
          swiper.updateSlidesClasses();
        }
        let translated;
        if (swiper.params.freeMode && swiper.params.freeMode.enabled) {
          setTranslate2();
          if (swiper.params.autoHeight) {
            swiper.updateAutoHeight();
          }
        } else {
          if ((swiper.params.slidesPerView === "auto" || swiper.params.slidesPerView > 1) && swiper.isEnd && !swiper.params.centeredSlides) {
            translated = swiper.slideTo(swiper.slides.length - 1, 0, false, true);
          } else {
            translated = swiper.slideTo(swiper.activeIndex, 0, false, true);
          }
          if (!translated) {
            setTranslate2();
          }
        }
        if (params.watchOverflow && snapGrid !== swiper.snapGrid) {
          swiper.checkOverflow();
        }
        swiper.emit("update");
      }
      changeDirection(newDirection, needUpdate = true) {
        const swiper = this;
        const currentDirection = swiper.params.direction;
        if (!newDirection) {
          newDirection = currentDirection === "horizontal" ? "vertical" : "horizontal";
        }
        if (newDirection === currentDirection || newDirection !== "horizontal" && newDirection !== "vertical") {
          return swiper;
        }
        swiper.$el.removeClass(`${swiper.params.containerModifierClass}${currentDirection}`).addClass(`${swiper.params.containerModifierClass}${newDirection}`);
        swiper.emitContainerClasses();
        swiper.params.direction = newDirection;
        swiper.slides.each((slideEl) => {
          if (newDirection === "vertical") {
            slideEl.style.width = "";
          } else {
            slideEl.style.height = "";
          }
        });
        swiper.emit("changeDirection");
        if (needUpdate)
          swiper.update();
        return swiper;
      }
      mount(el) {
        const swiper = this;
        if (swiper.mounted)
          return true;
        const $el = $(el || swiper.params.el);
        el = $el[0];
        if (!el) {
          return false;
        }
        el.swiper = swiper;
        const getWrapperSelector = () => {
          return `.${(swiper.params.wrapperClass || "").trim().split(" ").join(".")}`;
        };
        const getWrapper = () => {
          if (el && el.shadowRoot && el.shadowRoot.querySelector) {
            const res = $(el.shadowRoot.querySelector(getWrapperSelector()));
            res.children = (options2) => $el.children(options2);
            return res;
          }
          return $el.children(getWrapperSelector());
        };
        let $wrapperEl = getWrapper();
        if ($wrapperEl.length === 0 && swiper.params.createElements) {
          const document2 = getDocument();
          const wrapper = document2.createElement("div");
          $wrapperEl = $(wrapper);
          wrapper.className = swiper.params.wrapperClass;
          $el.append(wrapper);
          $el.children(`.${swiper.params.slideClass}`).each((slideEl) => {
            $wrapperEl.append(slideEl);
          });
        }
        Object.assign(swiper, {
          $el,
          el,
          $wrapperEl,
          wrapperEl: $wrapperEl[0],
          mounted: true,
          rtl: el.dir.toLowerCase() === "rtl" || $el.css("direction") === "rtl",
          rtlTranslate: swiper.params.direction === "horizontal" && (el.dir.toLowerCase() === "rtl" || $el.css("direction") === "rtl"),
          wrongRTL: $wrapperEl.css("display") === "-webkit-box"
        });
        return true;
      }
      init(el) {
        const swiper = this;
        if (swiper.initialized)
          return swiper;
        const mounted = swiper.mount(el);
        if (mounted === false)
          return swiper;
        swiper.emit("beforeInit");
        if (swiper.params.breakpoints) {
          swiper.setBreakpoint();
        }
        swiper.addClasses();
        if (swiper.params.loop) {
          swiper.loopCreate();
        }
        swiper.updateSize();
        swiper.updateSlides();
        if (swiper.params.watchOverflow) {
          swiper.checkOverflow();
        }
        if (swiper.params.grabCursor && swiper.enabled) {
          swiper.setGrabCursor();
        }
        if (swiper.params.preloadImages) {
          swiper.preloadImages();
        }
        if (swiper.params.loop) {
          swiper.slideTo(swiper.params.initialSlide + swiper.loopedSlides, 0, swiper.params.runCallbacksOnInit, false, true);
        } else {
          swiper.slideTo(swiper.params.initialSlide, 0, swiper.params.runCallbacksOnInit, false, true);
        }
        swiper.attachEvents();
        swiper.initialized = true;
        swiper.emit("init");
        swiper.emit("afterInit");
        return swiper;
      }
      destroy(deleteInstance = true, cleanStyles = true) {
        const swiper = this;
        const {
          params,
          $el,
          $wrapperEl,
          slides
        } = swiper;
        if (typeof swiper.params === "undefined" || swiper.destroyed) {
          return null;
        }
        swiper.emit("beforeDestroy");
        swiper.initialized = false;
        swiper.detachEvents();
        if (params.loop) {
          swiper.loopDestroy();
        }
        if (cleanStyles) {
          swiper.removeClasses();
          $el.removeAttr("style");
          $wrapperEl.removeAttr("style");
          if (slides && slides.length) {
            slides.removeClass([params.slideVisibleClass, params.slideActiveClass, params.slideNextClass, params.slidePrevClass].join(" ")).removeAttr("style").removeAttr("data-swiper-slide-index");
          }
        }
        swiper.emit("destroy");
        Object.keys(swiper.eventsListeners).forEach((eventName) => {
          swiper.off(eventName);
        });
        if (deleteInstance !== false) {
          swiper.$el[0].swiper = null;
          deleteProps(swiper);
        }
        swiper.destroyed = true;
        return null;
      }
      static extendDefaults(newDefaults) {
        extend$1(extendedDefaults, newDefaults);
      }
      static get extendedDefaults() {
        return extendedDefaults;
      }
      static get defaults() {
        return defaults;
      }
      static installModule(mod) {
        if (!Swiper$1.prototype.__modules__)
          Swiper$1.prototype.__modules__ = [];
        const modules = Swiper$1.prototype.__modules__;
        if (typeof mod === "function" && modules.indexOf(mod) < 0) {
          modules.push(mod);
        }
      }
      static use(module2) {
        if (Array.isArray(module2)) {
          module2.forEach((m) => Swiper$1.installModule(m));
          return Swiper$1;
        }
        Swiper$1.installModule(module2);
        return Swiper$1;
      }
    };
    Object.keys(prototypes).forEach((prototypeGroup) => {
      Object.keys(prototypes[prototypeGroup]).forEach((protoMethod) => {
        Swiper$1.prototype[protoMethod] = prototypes[prototypeGroup][protoMethod];
      });
    });
    Swiper$1.use([Resize, Observer]);
    paramsList = [
      "modules",
      "init",
      "_direction",
      "touchEventsTarget",
      "initialSlide",
      "_speed",
      "cssMode",
      "updateOnWindowResize",
      "resizeObserver",
      "nested",
      "focusableElements",
      "_enabled",
      "_width",
      "_height",
      "preventInteractionOnTransition",
      "userAgent",
      "url",
      "_edgeSwipeDetection",
      "_edgeSwipeThreshold",
      "_freeMode",
      "_autoHeight",
      "setWrapperSize",
      "virtualTranslate",
      "_effect",
      "breakpoints",
      "_spaceBetween",
      "_slidesPerView",
      "_grid",
      "_slidesPerGroup",
      "_slidesPerGroupSkip",
      "_slidesPerGroupAuto",
      "_centeredSlides",
      "_centeredSlidesBounds",
      "_slidesOffsetBefore",
      "_slidesOffsetAfter",
      "normalizeSlideIndex",
      "_centerInsufficientSlides",
      "_watchOverflow",
      "roundLengths",
      "touchRatio",
      "touchAngle",
      "simulateTouch",
      "_shortSwipes",
      "_longSwipes",
      "longSwipesRatio",
      "longSwipesMs",
      "_followFinger",
      "allowTouchMove",
      "_threshold",
      "touchMoveStopPropagation",
      "touchStartPreventDefault",
      "touchStartForcePreventDefault",
      "touchReleaseOnEdges",
      "uniqueNavElements",
      "_resistance",
      "_resistanceRatio",
      "_watchSlidesProgress",
      "_grabCursor",
      "preventClicks",
      "preventClicksPropagation",
      "_slideToClickedSlide",
      "_preloadImages",
      "updateOnImagesReady",
      "_loop",
      "_loopAdditionalSlides",
      "_loopedSlides",
      "_loopFillGroupWithBlank",
      "loopPreventsSlide",
      "_rewind",
      "_allowSlidePrev",
      "_allowSlideNext",
      "_swipeHandler",
      "_noSwiping",
      "noSwipingClass",
      "noSwipingSelector",
      "passiveListeners",
      "containerModifierClass",
      "slideClass",
      "slideBlankClass",
      "slideActiveClass",
      "slideDuplicateActiveClass",
      "slideVisibleClass",
      "slideDuplicateClass",
      "slideNextClass",
      "slideDuplicateNextClass",
      "slidePrevClass",
      "slideDuplicatePrevClass",
      "wrapperClass",
      "runCallbacksOnInit",
      "observer",
      "observeParents",
      "observeSlideChildren",
      "a11y",
      "autoplay",
      "_controller",
      "coverflowEffect",
      "cubeEffect",
      "fadeEffect",
      "flipEffect",
      "creativeEffect",
      "cardsEffect",
      "hashNavigation",
      "history",
      "keyboard",
      "lazy",
      "mousewheel",
      "_navigation",
      "_pagination",
      "parallax",
      "_scrollbar",
      "_thumbs",
      "_virtual",
      "zoom"
    ];
    Swiper = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let $$restProps = compute_rest_props($$props, ["class", "swiper"]);
      const dispatch = createEventDispatcher();
      let { class: className = void 0 } = $$props;
      let containerClasses = "swiper";
      let swiperInstance = null;
      let paramsData;
      let swiperParams;
      let restProps;
      let swiperEl = null;
      let prevEl = null;
      let nextEl = null;
      let scrollbarEl = null;
      let paginationEl = null;
      let virtualData = { slides: [] };
      function swiper() {
        return swiperInstance;
      }
      const setVirtualData = (data) => {
        virtualData = data;
        tick().then(() => {
          swiperInstance.$wrapperEl.children(".swiper-slide").each((el) => {
            if (el.onSwiper)
              el.onSwiper(swiperInstance);
          });
          swiperInstance.updateSlides();
          swiperInstance.updateProgress();
          swiperInstance.updateSlidesClasses();
          if (swiperInstance.lazy && swiperInstance.params.lazy.enabled) {
            swiperInstance.lazy.load();
          }
        });
      };
      const calcParams = () => {
        paramsData = getParams($$restProps);
        swiperParams = paramsData.params;
        restProps = paramsData.rest;
      };
      calcParams();
      const onBeforeBreakpoint = () => {
      };
      swiperParams.onAny = (event, ...args) => {
        dispatch(event, [args]);
      };
      Object.assign(swiperParams.on, {
        _beforeBreakpoint: onBeforeBreakpoint,
        _containerClasses(_swiper, classes2) {
          containerClasses = classes2;
        }
      });
      swiperInstance = initSwiper(swiperParams);
      if (swiperInstance.virtual && swiperInstance.params.virtual.enabled) {
        const extendWith = {
          cache: false,
          renderExternal: (data) => {
            setVirtualData(data);
            if (swiperParams.virtual && swiperParams.virtual.renderExternal) {
              swiperParams.virtual.renderExternal(data);
            }
          },
          renderExternalUpdate: false
        };
        extend(swiperInstance.params.virtual, extendWith);
        extend(swiperInstance.originalParams.virtual, extendWith);
      }
      onDestroy(() => {
        if (typeof window !== "undefined" && swiperInstance && !swiperInstance.destroyed) {
          swiperInstance.destroy(true, false);
        }
      });
      if ($$props.class === void 0 && $$bindings.class && className !== void 0)
        $$bindings.class(className);
      if ($$props.swiper === void 0 && $$bindings.swiper && swiper !== void 0)
        $$bindings.swiper(swiper);
      return `<div${spread([
        {
          class: escape_attribute_value(uniqueClasses(`${containerClasses}${className ? ` ${className}` : ""}`))
        },
        escape_object(restProps)
      ])}${add_attribute("this", swiperEl, 0)}>${slots["container-start"] ? slots["container-start"]({ virtualData }) : ``}
  ${needsNavigation(swiperParams) ? `<div class="${"swiper-button-prev"}"${add_attribute("this", prevEl, 0)}></div>
    <div class="${"swiper-button-next"}"${add_attribute("this", nextEl, 0)}></div>` : ``}
  ${needsScrollbar(swiperParams) ? `<div class="${"swiper-scrollbar"}"${add_attribute("this", scrollbarEl, 0)}></div>` : ``}
  ${needsPagination(swiperParams) ? `<div class="${"swiper-pagination"}"${add_attribute("this", paginationEl, 0)}></div>` : ``}
  <div class="${"swiper-wrapper"}">${slots["wrapper-start"] ? slots["wrapper-start"]({ virtualData }) : ``}
    ${slots.default ? slots.default({ virtualData }) : ``}
    ${slots["wrapper-end"] ? slots["wrapper-end"]({ virtualData }) : ``}</div>
  ${slots["container-end"] ? slots["container-end"]({ virtualData }) : ``}</div>`;
    });
    Swiper_slide = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let slideData;
      let $$restProps = compute_rest_props($$props, ["zoom", "virtualIndex", "class"]);
      let { zoom = void 0 } = $$props;
      let { virtualIndex = void 0 } = $$props;
      let { class: className = void 0 } = $$props;
      let slideEl = null;
      let slideClasses = "swiper-slide";
      onDestroy(() => {
        return;
      });
      if ($$props.zoom === void 0 && $$bindings.zoom && zoom !== void 0)
        $$bindings.zoom(zoom);
      if ($$props.virtualIndex === void 0 && $$bindings.virtualIndex && virtualIndex !== void 0)
        $$bindings.virtualIndex(virtualIndex);
      if ($$props.class === void 0 && $$bindings.class && className !== void 0)
        $$bindings.class(className);
      slideData = {
        isActive: slideClasses.indexOf("swiper-slide-active") >= 0 || slideClasses.indexOf("swiper-slide-duplicate-active") >= 0,
        isVisible: slideClasses.indexOf("swiper-slide-visible") >= 0,
        isDuplicate: slideClasses.indexOf("swiper-slide-duplicate") >= 0,
        isPrev: slideClasses.indexOf("swiper-slide-prev") >= 0 || slideClasses.indexOf("swiper-slide-duplicate-prev") >= 0,
        isNext: slideClasses.indexOf("swiper-slide-next") >= 0 || slideClasses.indexOf("swiper-slide-duplicate-next") >= 0
      };
      return `<div${spread([
        {
          class: escape_attribute_value(uniqueClasses(`${slideClasses}${className ? ` ${className}` : ""}`))
        },
        {
          "data-swiper-slide-index": escape_attribute_value(virtualIndex)
        },
        escape_object($$restProps)
      ])}${add_attribute("this", slideEl, 0)}>${zoom ? `<div class="${"swiper-zoom-container"}"${add_attribute("data-swiper-zoom", typeof zoom === "number" ? zoom : void 0, 0)}>${slots.default ? slots.default({ data: slideData }) : ``}</div>` : `${slots.default ? slots.default({ data: slideData }) : ``}`}</div>`;
    });
    Banner = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      Swiper$1.use([Autoplay, Pagination, Navigation]);
      return `
		${validate_component(Swiper, "Swiper").$$render($$result, {
        loop: true,
        spaceBetween: 0,
        centeredSlides: true,
        autoplay: { delay: 2500, disableOnInteraction: false },
        pagination: { clickable: true },
        navigation: false,
        class: "mySwiper"
      }, {}, {
        default: () => `${validate_component(Swiper_slide, "SwiperSlide").$$render($$result, {}, {}, {
          default: () => `<img src="${"https://miro.medium.com/max/1200/1*JsKuUx3-H1egm8XON18haw.png"}" style="${"border-radius:20px"}">`
        })}
           
            ${validate_component(Swiper_slide, "SwiperSlide").$$render($$result, {}, {}, {
          default: () => `<img src="${"https://miro.medium.com/max/1200/1*GTfVNy2wXY9Y5Woty1Bm2A.jpeg"}" style="${"border-radius:20px"}">`
        })}
            ${validate_component(Swiper_slide, "SwiperSlide").$$render($$result, {}, {}, {
          default: () => `<img src="${"https://ip.bitcointalk.org/?u=https%3A%2F%2Fi.imgur.com%2FEmEksZ8.png&t=631&c=veS83BLZf9gsug"}" style="${"border-radius:20px"}">`
        })}`
      })}
`;
    });
  }
});

// .svelte-kit/output/server/chunks/home-bc831c90.js
var home_bc831c90_exports = {};
__export(home_bc831c90_exports, {
  default: () => Home
});
var Home;
var init_home_bc831c90 = __esm({
  ".svelte-kit/output/server/chunks/home-bc831c90.js"() {
    init_shims();
    init_app_171d3477();
    init_tabs_3e2d466f();
    init_stakingTab_c9c49832();
    init_tvl_b6726eb0();
    init_banner_f9439a17();
    init_web3_store_7eaac438();
    init_index_8f6e8620();
    Home = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let $chainId, $$unsubscribe_chainId;
      $$unsubscribe_chainId = subscribe(chainId, (value) => $chainId = value);
      $$unsubscribe_chainId();
      return `${$$result.head += `<style data-svelte="svelte-oigo0y">.anticon {
    display: inline-block;
    color: inherit;
    font-style: normal;
    line-height: 0;
    text-align: center;
    text-transform: none;
    vertical-align: -0.125em;
    text-rendering: optimizeLegibility;
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    }
    .anticon > * {
    line-height: 1;
    }

    body, html{
       background-color: black;
    }
    .anticon svg {
    display: inline-block;
    }
    .anticon::before {
    display: none;
    }
    .anticon .anticon-icon {
    display: block;
    }
    .anticon[tabindex] {
    cursor: pointer;
    }
    .anticon-spin::before,
    .anticon-spin {
    display: inline-block;
    -webkit-animation: loadingCircle 1s infinite linear;
    animation: loadingCircle 1s infinite linear;
    }
    @-webkit-keyframes loadingCircle {
    100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
    }
    }
    @keyframes loadingCircle {
    100% {
    -webkit-transform: rotate(360deg);
    transform: rotate(360deg);
    }
    }
 </style>`, ""}
 
       <main><div class="${"EarnPage_EarnPage__sqMu9"}"><div class="${"container"}"><div class="${"PriceTiles_PriceTiles__8qvTB TilesSlider"}">${validate_component(Tvl, "Tvl").$$render($$result, {}, {}, {})}
                  ${validate_component(Banner, "Banner").$$render($$result, {}, {}, {})}
                  <div class="${"PricesSlider"}"><div class="${"swiper-container swiper-container-initialized swiper-container-horizontal swiper-container-pointer-events"}" style="${"cursor: grab;"}"></div>
                     <div class="${"swiper-pagination"}"></div></div>
                  <div class="${"EarnPage_EarnPage__userPools__1Qtyl"}"></div>
                  
                  <div class="${"EarnPage_EarnPage__allPools__7-Eob"}"><div class="${"ant-tabs ant-tabs-top earn-tabs"}"><div role="${"tablist"}" class="${"ant-tabs-nav"}"><div class="${"ant-tabs-extra-content"}"><div class="${"EarnPage_EarnPage__tabsTitle__2g4U7"}"><img src="${"all_active_vault.f48f66de.svg"}" alt="${"icon"}">
                                 <div class="${"s_text__2O9ZL s_h6__TYu-o s_weight-bold__7n-86"}">Active Vaults</div>
                                 <span class="${"s_text__2O9ZL s_body2__d8EpH s_secondary-color__3RLrb"}"><span class="${"s_text__2O9ZL s_body2__d8EpH s_secondary-color__3RLrb s_text_numbers__2nPsT"}">(18 </span>vaults in total)</span></div></div>
                           <div class="${"ant-tabs-nav-wrap"}"><div class="${"ant-tabs-nav-list"}" style="${"transform: translate(0px, 0px);"}"><div class="${"ant-tabs-tab ant-tabs-tab-active"}"><div role="${"tab"}" aria-selected="${"true"}" class="${"ant-tabs-tab-btn"}" tabindex="${"0"}" id="${"rc-tabs-0-tab-1"}" aria-controls="${"rc-tabs-0-panel-1"}">Active Vaults</div></div>
                             
                                 <div class="${"ant-tabs-ink-bar ant-tabs-ink-bar-animated"}" style="${"left: 0px; width: 111px;"}"></div></div></div>
                           <div class="${"ant-tabs-nav-operations ant-tabs-nav-operations-hidden"}"><button type="${"button"}" class="${"ant-tabs-nav-more"}" tabindex="${"-1"}" aria-hidden="${"true"}" aria-haspopup="${"listbox"}" aria-controls="${"rc-tabs-0-more-popup"}" id="${"rc-tabs-0-more"}" aria-expanded="${"false"}" style="${"visibility: hidden; order: 1;"}"><span role="${"img"}" aria-label="${"ellipsis"}" class="${"anticon anticon-ellipsis"}"><svg viewBox="${"64 64 896 896"}" focusable="${"false"}" data-icon="${"ellipsis"}" width="${"1em"}" height="${"1em"}" fill="${"currentColor"}" aria-hidden="${"true"}"><path d="${"M176 511a56 56 0 10112 0 56 56 0 10-112 0zm280 0a56 56 0 10112 0 56 56 0 10-112 0zm280 0a56 56 0 10112 0 56 56 0 10-112 0z"}"></path></svg></span></button></div></div>
                        <div class="${"ant-tabs-content-holder"}"><div class="${"ant-tabs-content ant-tabs-content-top"}"><div role="${"tabpanel"}" tabindex="${"0"}" aria-hidden="${"false"}" class="${"ant-tabs-tabpane ant-tabs-tabpane-active"}" id="${"rc-tabs-0-panel-1"}" aria-labelledby="${"rc-tabs-0-tab-1"}"><div class="${"ant-collapse ant-collapse-icon-position-right earn-collapse"}">${$chainId == 137 ? `${each2(optionsPolygon, (tabOption) => `${validate_component(StakingTab, "StakingTab").$$render($$result, {
        scritta: tabOption.scritta,
        name: tabOption.name,
        id: tabOption.id,
        image: tabOption.image
      }, {}, {})}`)}` : `${$chainId == 56 ? `${each2(optionsBsc, (tabOption) => `${validate_component(StakingTab, "StakingTab").$$render($$result, {
        scritta: tabOption.scritta,
        name: tabOption.name,
        id: tabOption.id,
        image: tabOption.image
      }, {}, {})}`)}` : ``}`}</div></div></div></div></div></div></div></div></div></main>`;
    });
  }
});

// .svelte-kit/output/server/chunks/launchTab-52bf17b3.js
var launchTab_52bf17b3_exports = {};
__export(launchTab_52bf17b3_exports, {
  default: () => LaunchTab
});
var css4, LaunchTab;
var init_launchTab_52bf17b3 = __esm({
  ".svelte-kit/output/server/chunks/launchTab-52bf17b3.js"() {
    init_shims();
    init_app_171d3477();
    css4 = {
      code: ".led.svelte-atqs47.svelte-atqs47{position:absolute}@media screen and (max-width: 640px){.led.svelte-atqs47.svelte-atqs47{position:relative}}.progress1.svelte-atqs47.svelte-atqs47{margin:50px auto;padding:2px;width:100%;max-width:500px;border-style:solid;border-width:1px;border-image:linear-gradient(165deg, #05e8fc, #8883fa 50%, #fe0291) 1;height:30px}.progress1.svelte-atqs47 .progress__bar1.svelte-atqs47{height:100%;width:0%;background:linear-gradient(165deg, #05e8fc, #8883fa 50%, #fe0291)}@-webkit-keyframes svelte-atqs47-loadingCircle{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@keyframes svelte-atqs47-loadingCircle{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}",
      map: null
    };
    LaunchTab = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      $$result.css.add(css4);
      return `${$$result.head += ``, ""}
<div class="${"py-4 md:py-8 lg:py-12 max-w-2xl w-full"}" id="${"swap-page"}"><div class="${"relative w-full max-w-2xl"}"><div class="${"led top-1/4 -left-10 bg-blue bottom-4 w-3/5 rounded-full z-0 filter blur-[400px] svelte-atqs47"}"></div>
       <div class="${"led bottom-1/4 -right-10 bg-pink top-4 w-3/5 rounded-full z-0 filter blur-[400px] svelte-atqs47"}"></div>
       <div class="${"relative filter drop-shadow"}"><div class="${"p-4 space-y-4 rounded bg-dark-900 z-1"}"><div class="${"flex justify-between mb-4 space-x-3 items-center"}"><div class="${"flex items-center"}"></div></div>
             <div><div id="${"swap-currency-input"}" class="${"p-5 rounded bg-dark-800"}"><div class="${"flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row"}"><div class="${"w-full "}"><div class="${"text-primary1 h-full outline-none select-none text-xl font-medium "}"><div class="${"flex"}"><div class="${"flex items-center"}"><div class="${"rounded"}" style="${"width: 54px; height: 54px;"}"><div class="${"overflow-hidden rounded"}" style="${"width: 54px; height: 54px;"}"><div style="${"overflow: hidden; box-sizing: border-box; display: inline-block; position: relative; width: 54px; height: 54px;"}"><img alt="${"ETH"}" srcset="${"https://bsc.aperocket.finance/images/vaults/xspace.svg 1x, https://bsc.aperocket.finance/images/vaults/xspace.svg 2x"}" src="${"https://bsc.aperocket.finance/images/vaults/xspace.svg"}" decoding="${"async"}" data-nimg="${"fixed"}" class="${"rounded"}" style="${"position: absolute; inset: 0px; box-sizing: border-box; padding: 0px; border: none; margin: auto; display: block; width: 0px; height: 0px; min-width: 100%; max-width: 100%; min-height: 100%; max-height: 100%; filter: none; background-size: cover; background-image: none; background-position: 0% 0%;"}">
                                           <noscript></noscript></div></div></div></div>
                               <div class="${"flex flex-1 flex-col items-start justify-center mx-3.5"}"><div class="${"flex items-center"}"><div class="${"text-4xl font-bold token-symbol-container "}">ApeRocket</div></div>
                                  <div class="${"font-medium text-center whitespace-nowrap"}">Public Presale</div></div></div>
                               <div class="${"grid py-3"}"><div class="${"w-full flex p-0 Row__AutoRow-sc-18omu2-2 jQYXTF"}" style="${"padding: 0px 1rem;"}"></div></div>
                               <div class="${"text-3xl font-bold"}">\u{1F435} Introduction to Aperocket </div>
                               <div class="${"font-medium "}">The first and main product developed by Aperocket is a Yield Aggregator. <br>It aggregates and compounds yields from others protocols, and saves you time and money compared to doing it yourself.<br><br>
                                  The product targets yield farmers who want to invest money, and maximize their profits. Our team is always looking for opportunities to generate returns on your assets for all risk tolerence level.<br>
                                  The Yield aggregator is implemented as a set of smart contracts on top of the Binance Smart Chain.</div></div></div></div></div>
                                  <div class="${"grid py-3"}"><div class="${"w-full flex p-0 Row__AutoRow-sc-18omu2-2 jQYXTF"}" style="${"padding: 0px 1rem;"}"></div></div>

                                        <div id="${"swap-currency-input"}" class="${"p-5 rounded bg-dark-800"}"><div class="${"flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row"}"><div class="${"w-full "}"><div class="${"text-primary1 h-full outline-none select-none text-xl font-medium "}"><div class="${"container text-left"}"><div class="${"ant-row "}"><div class="${"ant-col-8 font-bold text-xl"}">Total supply:</div>
                                              <div class="${"ant-col-8 font-bold text-xl"}"></div>
                                              <div class="${"ant-col-8 text-xl"}">100</div></div>
                                           <div class="${"ant-row"}"><div class="${"ant-col-8 font-bold text-xl"}">Launch date:</div>
                                              <div class="${"ant-col-8 font-bold text-xl"}"></div>
                                              <div class="${"ant-col-8 text-xl"}">27/07/21</div></div>
                                           <div class="${"ant-row"}"><div class="${"ant-col-8 font-bold text-xl"}">Total raised:</div>
                                              <div class="${"ant-col-8 font-bold text-xl"}"></div>
                                              <div class="${"ant-col-8 text-xl"}">$100.000</div></div>
                                           <div class="${"ant-row"}"><div class="${"ant-col-8 font-bold text-xl"}">To raise:</div>
                                              <div class="${"ant-col-8 font-bold text-xl"}"></div>
                                              <div class="${"ant-col-8 text-xl"}">500.000</div></div>
                                           <div class="${"ant-row"}"><div class="${"ant-col-8 font-bold text-xl"}">Time:</div>
                                              <div class="${"ant-col-8 font-bold text-xl"}"></div>
                                              <div class="${"ant-col-8 text-xl"}">3 months</div></div></div>
                                        <br>
                                        <div class="${"progress1  svelte-atqs47"}" style="${"border-radius: 20px;"}"><div class="${"progress__bar1 svelte-atqs47"}" style="${"width: 43%; text-align: center; color: white; "}">43% </div></div></div></div></div></div>
                                              <div class="${"grid py-3"}"><div class="${"w-full flex p-0 Row__AutoRow-sc-18omu2-2 jQYXTF"}" style="${"padding: 0px 1rem;"}"></div></div>
                                              <div id="${"swap-currency-input"}" class="${"p-5 rounded bg-dark-800"}"><div class="${"flex flex-col justify-between space-y-3 sm:space-y-0 sm:flex-row"}"><div class="${"w-full "}"><div class="${"text-primary1 h-full outline-none select-none text-xl font-medium "}"><div class="${"text-xl font-bold"}">Contribute in bnb:</div>
                                              <br>
                                              
                                  <div class="${"container"}"><div class="${"ant-row "}"><div class="${"ant-col-4"}"><img src="${"https://img.api.cryptorank.io/exchanges/binance%20futures1605113349439.png"}" width="${"40px"}" style="${"float: right; margin-right: 30px; margin-top: 5px;"}"></div>
                                        <div class="${"ant-col-19 "}"><div class="${"flex items-center w-full space-x-3 rounded bg-dark-900 focus:bg-dark-700 p-3 "}"><input oninput="${"tokens()"}" id="${"token-amount-input"}" inputmode="${"decimal"}" title="${"Token Amount"}" autocomplete="${"off"}" autocorrect="${"off"}" type="${"text"}" pattern="${"^[0-9]*[.,]?[0-9]*$"}" placeholder="${"0.0"}" min="${"0"}" minlength="${"1"}" maxlength="${"79"}" spellcheck="${"false"}" class="${"relative font-bold outline-none border-none flex-auto overflow-hidden overflow-ellipsis placeholder-low-emphesis focus:placeholder-primary w-0 p-0 text-2xl bg-transparent"}" value="${""}"></div></div></div></div>

                               <button class="${"z-10 -mt-6 -mb-6 rounded-full"}" style="${"margin-bottom: 5px; margin-top: 5px;"}"><div class="${"rounded-full bg-dark-900 p-3px"}"><div class="${"p-3 rounded-full bg-dark-800 hover:bg-dark-700"}"><div style="${"width: 32px; height: 32px;"}"><svg xmlns="${"http://www.w3.org/2000/svg"}" viewBox="${"0 0 500 500"}" width="${"500"}" height="${"500"}" preserveAspectRatio="${"xMidYMid meet"}" style="${"width: 100%; height: 100%; transform: translate3d(0px, 0px, 0px);"}"><defs><clipPath id="${"__lottie_element_248"}"><rect width="${"500"}" height="${"500"}" x="${"0"}" y="${"0"}"></rect></clipPath><clipPath id="${"__lottie_element_250"}"><path d="${"M0,0 L500,0 L500,500 L0,500z"}"></path></clipPath></defs><g clip-path="${"url(#__lottie_element_248)"}"><g transform="${"matrix(4.5,0,0,4.5,207.25,194.875)"}" opacity="${"1"}" style="${"display: block;"}"><g opacity="${"1"}" transform="${"matrix(1,0,0,1,0,0)"}"><path stroke-linecap="${"round"}" stroke-linejoin="${"round"}" fill-opacity="${"0"}" stroke="${"rgb(226,226,226)"}" stroke-opacity="${"1"}" stroke-width="${"5.6000000000000005"}" d="${" M28.945999145507812,-27.937000274658203 C28.966999053955078,-9.605999946594238 29.014999389648438,33.75299835205078 29.034000396728516,50.236000061035156"}"></path></g></g><g transform="${"matrix(3.1819803714752197,-3.1819803714752197,3.1819803714752197,3.1819803714752197,363.2012939453125,326.5682373046875)"}" opacity="${"1"}" style="${"display: block;"}"><g opacity="${"1"}" transform="${"matrix(1,0,0,1,0,0)"}"><path stroke-linecap="${"round"}" stroke-linejoin="${"round"}" fill-opacity="${"0"}" stroke="${"rgb(226,226,226)"}" stroke-opacity="${"1"}" stroke-width="${"5.6000000000000005"}" d="${" M-20.548999786376953,-4.929999828338623 C-20.548999786376953,-4.929999828338623 -20.548999786376953,12.746999740600586 -20.548999786376953,12.746999740600586 C-20.548999786376953,12.746999740600586 -2.927000045776367,12.746999740600586 -2.927000045776367,12.746999740600586"}"></path></g></g><g transform="${"matrix(-4.5,0,0,-4.5,292.75,305.125)"}" opacity="${"1"}" style="${"display: block;"}"><g opacity="${"1"}" transform="${"matrix(1,0,0,1,0,0)"}"><path stroke-linecap="${"round"}" stroke-linejoin="${"round"}" fill-opacity="${"0"}" stroke="${"rgb(226,226,226)"}" stroke-opacity="${"1"}" stroke-width="${"5.6000000000000005"}" d="${" M28.945999145507812,-27.937000274658203 C28.966999053955078,-9.605999946594238 29.014999389648438,33.75299835205078 29.034000396728516,50.236000061035156"}"></path></g></g><g transform="${"matrix(-3.1819803714752197,3.1819803714752197,-3.1819803714752197,-3.1819803714752197,136.79869079589844,173.43174743652344)"}" opacity="${"1"}" style="${"display: block;"}"><g opacity="${"1"}" transform="${"matrix(1,0,0,1,0,0)"}"><path stroke-linecap="${"round"}" stroke-linejoin="${"round"}" fill-opacity="${"0"}" stroke="${"rgb(226,226,226)"}" stroke-opacity="${"1"}" stroke-width="${"5.6000000000000005"}" d="${" M-20.548999786376953,-4.929999828338623 C-20.548999786376953,-4.929999828338623 -20.548999786376953,12.746999740600586 -20.548999786376953,12.746999740600586 C-20.548999786376953,12.746999740600586 -2.927000045776367,12.746999740600586 -2.927000045776367,12.746999740600586"}"></path></g></g><g clip-path="${"url(#__lottie_element_250)"}" transform="${"matrix(1,0,0,1,0,0)"}" opacity="${"1"}" style="${"display: block;"}"></g></g></svg></div></div></div></button>


                               <div class="${"container"}"><div class="${"ant-row "}"><div class="${"ant-col-4 "}"><img src="${"https://dashboard-assets.dappradar.com/document/6993/aperocket-dapp-defi-bsc-logo-166x166_b5ac720d6f49e2aef740f4dd943c6d29.png"}" width="${"45px"}" style="${"float: right; margin-right: 30px; margin-top: 5px;"}"></div>
                                     <div class="${"ant-col-19 "}"><div class="${"flex items-center w-full space-x-3 rounded bg-dark-900 focus:bg-dark-700 p-3 "}"><input id="${"token-amount-output"}" inputmode="${"decimal"}" title="${"Token Amount"}" autocomplete="${"off"}" autocorrect="${"off"}" type="${"text"}" pattern="${"^[0-9]*[.,]?[0-9]*$"}" placeholder="${"0.0"}" min="${"0"}" minlength="${"1"}" maxlength="${"79"}" spellcheck="${"false"}" class="${"relative font-bold outline-none border-none flex-auto overflow-hidden overflow-ellipsis placeholder-low-emphesis focus:placeholder-primary w-0 p-0 text-2xl bg-transparent"}" value="${""}"></div></div></div></div>

                                  <br>
                      <div class="${"container text-left"}"><div class="${"ant-row "}"><div class="${"ant-col-8 font-bold text-xl"}">My contribuation:</div>
                            <div class="${"ant-col-8 font-bold text-xl"}"></div>
                            <div class="${"ant-col-8 text-xl"}">5 BNB</div></div>
                         <div class="${"ant-row "}"><div class="${"ant-col-8 font-bold text-xl"}">Token reserved:</div>
                            <div class="${"ant-col-8 font-bold text-xl"}"></div>
                            <div class="${"ant-col-8 text-xl"}">123</div></div></div>
                         <br></div></div></div></div>
                <div class="${"grid py-3"}"><div class="${"w-full flex p-0 Row__AutoRow-sc-18omu2-2 jQYXTF"}" style="${"padding: 0px 1rem;"}"></div></div>
                     

               
             
             
             <div class="${"styleds__BottomGrouping-sc-zj8gmh-4 fpacZx"}"><button class="${"w-full text-high-emphesis bg-gradient-to-r from-blue to-pink opacity-80 hover:opacity-100 disabled:bg-opacity-80 px-6 py-4 text-base rounded disabled:cursor-not-allowed focus:outline-none"}">Contribute
                </button></div></div></div></div></div>
 </div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/launchpad-a893687d.js
var launchpad_a893687d_exports = {};
__export(launchpad_a893687d_exports, {
  default: () => Launchpad
});
var Launchpad;
var init_launchpad_a893687d = __esm({
  ".svelte-kit/output/server/chunks/launchpad-a893687d.js"() {
    init_shims();
    init_app_171d3477();
    init_launchTab_52bf17b3();
    Launchpad = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      return `${$$result.head += `<link rel="${"stylesheet"}" href="${"css.css"}" data-svelte="svelte-129swaq">`, ""} 


        <div class="${"flex-col items-center justify-start flex-grow w-full h-full "}" style="${"height: max-content;"}"><div id="${"__next"}"><div class="${"z-0 flex flex-col items-center w-full pb-16 lg:pb-0"}">${validate_component(LaunchTab, "LaunchTab").$$render($$result, {}, {}, {})}</div></div></div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/menu-67c0da2d.js
var menu_67c0da2d_exports = {};
__export(menu_67c0da2d_exports, {
  default: () => Menu
});
function codeShort(code) {
  let a = code.slice(0, 6);
  let b = code.slice(-4);
  return `${a}...${b}`;
}
var Menu;
var init_menu_67c0da2d = __esm({
  ".svelte-kit/output/server/chunks/menu-67c0da2d.js"() {
    init_shims();
    init_app_171d3477();
    init_web3_store_7eaac438();
    init_url_9b321f75();
    init_index_8f6e8620();
    Menu = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let $selectedAccount, $$unsubscribe_selectedAccount;
      let $url, $$unsubscribe_url;
      let $connected, $$unsubscribe_connected;
      let $chainId, $$unsubscribe_chainId;
      $$unsubscribe_selectedAccount = subscribe(selectedAccount, (value) => $selectedAccount = value);
      $$unsubscribe_url = subscribe(url, (value) => $url = value);
      $$unsubscribe_connected = subscribe(connected, (value) => $connected = value);
      $$unsubscribe_chainId = subscribe(chainId, (value) => $chainId = value);
      let header;
      let mobile;
      let navM;
      $$unsubscribe_selectedAccount();
      $$unsubscribe_url();
      $$unsubscribe_connected();
      $$unsubscribe_chainId();
      return `<header class="${"Header_header__aCt89 header"}"${add_attribute("this", header, 0)}><div class="${"container"}"><div class="${"ant-row ant-row-space-between ant-row-middle"}" style="${"row-gap: 0px;"}"><div class="${"Header_header__logo__3iwFp"}"><img alt="${"logo"}" src="${"logo2.png"}" width="${"200px"}"></div>
			<button role="${"button"}" tabindex="${"0"}" type="${"button"}" class="${"ant-btn Header_nav_icon__1pfDU"}"${add_attribute("this", mobile, 0)}><span></span><span></span><span></span><span></span></button>
			<nav class="${"Header_header__nav__2ub6P"}"${add_attribute("this", navM, 0)}><ul class="${"nav-list Header_header__nav__list__3OOx4"}"><li>${$url.hash === "" || $url.hash === "#/" ? `<a class="${"Header_header__nav__link__2WlEQ active"}" href="${"#/"}" style="${"pointer-events: all;"}"><span class="${"Header_header__nav__link__item__3WAT7"}" style="${"transition-delay: 0.14s;"}">Earn</span></a>` : `<a class="${"Header_header__nav__link__2WlEQ"}" href="${"#/"}" style="${"pointer-events: all;"}"><span class="${"Header_header__nav__link__item__3WAT7"}" style="${"transition-delay: 0.14s;"}">Earn</span></a>`}</li>

					<li>${$url.hash === "#/launchpad" ? `<a class="${"Header_header__nav__link__2WlEQ active"}" href="${"#/launchpad"}"><span class="${"Header_header__nav__link__item__3WAT7"}" style="${"transition-delay: 0.12s;"}">Launchpad</span></a>` : `<a class="${"Header_header__nav__link__2WlEQ"}" href="${"#/launchpad"}"><span class="${"Header_header__nav__link__item__3WAT7"}" style="${"transition-delay: 0.12s;"}">Launchpad</span></a>`}</li>

					<li>${$url.hash === "#/bridge" ? `<a class="${"Header_header__nav__link__2WlEQ active"}" href="${"#/bridge"}" style="${"pointer-events: all;"}"><span class="${"Header_header__nav__link__item__3WAT7"}" style="${"transition-delay: 0.02s;"}">Bridge</span></a>` : `<a class="${"Header_header__nav__link__2WlEQ"}" href="${"#/bridge"}" style="${"pointer-events: all;"}"><span class="${"Header_header__nav__link__item__3WAT7"}" style="${"transition-delay: 0.02s;"}">Bridge</span></a>`}</li></ul></nav>
			<div class="${"Header_header__userBar__3NCvG"}"><div class="${"UserBar_userBar__11QVa"}"></div>
				<div><button type="${"button"}" class="${"ant-btn button-1 big Wallet_wallet__btn__2Ueik"}"><span class="${"s_text__2O9ZL s_body1__1kjhf s_weight-bold__7n-86 s_text_numbers__2nPsT"}"><img src="${"sYSL.svg"}" style="${"margin-left: 0px; margin-right: 12px;"}">$0.00</span></button></div>

				<div><button type="${"button"}" class="${"ant-btn button-1 big Wallet_wallet__btn__2Ueik"}"><span class="${"s_text__2O9ZL s_body1__1kjhf s_weight-bold__7n-86 s_text_numbers__2nPsT"}">${$connected ? `${$chainId == 137 ? `<img src="${"https://app.sushi.com/_next/image?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsushiswap%2Ficons%2Fmaster%2Fnetwork%2Fpolygon.jpg&w=48&q=75"}" style="${"margin-left: 0px; margin-right: 12px; border-radius: 50%;"}">` : `${$chainId == 56 ? `<img src="${"https://app.sushi.com/_next/image?url=https%3A%2F%2Fraw.githubusercontent.com%2Fsushiswap%2Ficons%2Fmaster%2Fnetwork%2Fbsc.jpg&w=48&q=75"}" style="${"margin-left: 0px; margin-right: 12px; border-radius: 50%;"}">` : ``}`}
								${escape(codeShort($selectedAccount))}` : `Connect Wallet`}
							<img src="${"metamask.53ea9825.svg"}" alt="${"icon"}"></span></button></div></div></div></div></header>`;
    });
  }
});

// .svelte-kit/output/server/chunks/index-f03303d8.js
var index_f03303d8_exports = {};
__export(index_f03303d8_exports, {
  default: () => Routes
});
var Routes;
var init_index_f03303d8 = __esm({
  ".svelte-kit/output/server/chunks/index-f03303d8.js"() {
    init_shims();
    init_app_171d3477();
    init_bridge_a2406c9e();
    init_home_bc831c90();
    init_launchpad_a893687d();
    init_menu_67c0da2d();
    init_url_9b321f75();
    init_bridgetab_51870fe2();
    init_tabs_3e2d466f();
    init_web3_store_7eaac438();
    init_index_8f6e8620();
    init_stakingTab_c9c49832();
    init_tvl_b6726eb0();
    init_banner_f9439a17();
    init_launchTab_52bf17b3();
    Routes = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let $url, $$unsubscribe_url;
      $$unsubscribe_url = subscribe(url, (value) => $url = value);
      $$unsubscribe_url();
      return `${$$result.head += `<link rel="${"stylesheet"}" href="${"css1.css"}" data-svelte="svelte-1m5ls6s"><link rel="${"stylesheet"}" href="${"css2.css"}" data-svelte="svelte-1m5ls6s"><link rel="${"stylesheet"}" href="${"css3.css"}" data-svelte="svelte-1m5ls6s">`, ""}

<div id="${"root"}"><div class="${"layout"}">${validate_component(Menu, "Menu").$$render($$result, {}, {}, {})}
		${$url.hash === "" || $url.hash === "#/" ? `${validate_component(Home, "Home").$$render($$result, {}, {}, {})}` : `${$url.hash === "#/launchpad" ? `${validate_component(Launchpad, "Launchpad").$$render($$result, {}, {}, {})}` : `${$url.hash === "#/bridge" ? `${validate_component(Bridge, "Bridge").$$render($$result, {}, {}, {})}` : `<h1>404</h1>`}`}`}</div></div>`;
    });
  }
});

// .svelte-kit/output/server/chunks/lottery-9d0a3c39.js
var lottery_9d0a3c39_exports = {};
__export(lottery_9d0a3c39_exports, {
  default: () => Lottery
});
function is_date(obj) {
  return Object.prototype.toString.call(obj) === "[object Date]";
}
function get_interpolator(a, b) {
  if (a === b || a !== a)
    return () => a;
  const type = typeof a;
  if (type !== typeof b || Array.isArray(a) !== Array.isArray(b)) {
    throw new Error("Cannot interpolate values of different type");
  }
  if (Array.isArray(a)) {
    const arr = b.map((bi, i) => {
      return get_interpolator(a[i], bi);
    });
    return (t) => arr.map((fn) => fn(t));
  }
  if (type === "object") {
    if (!a || !b)
      throw new Error("Object cannot be null");
    if (is_date(a) && is_date(b)) {
      a = a.getTime();
      b = b.getTime();
      const delta = b - a;
      return (t) => new Date(a + t * delta);
    }
    const keys = Object.keys(b);
    const interpolators = {};
    keys.forEach((key) => {
      interpolators[key] = get_interpolator(a[key], b[key]);
    });
    return (t) => {
      const result = {};
      keys.forEach((key) => {
        result[key] = interpolators[key](t);
      });
      return result;
    };
  }
  if (type === "number") {
    const delta = b - a;
    return (t) => a + t * delta;
  }
  throw new Error(`Cannot interpolate ${type} values`);
}
function tweened(value, defaults2 = {}) {
  const store = writable(value);
  let task;
  let target_value = value;
  function set(new_value, opts) {
    if (value == null) {
      store.set(value = new_value);
      return Promise.resolve();
    }
    target_value = new_value;
    let previous_task = task;
    let started = false;
    let { delay = 0, duration = 400, easing = identity, interpolate = get_interpolator } = assign(assign({}, defaults2), opts);
    if (duration === 0) {
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      store.set(value = target_value);
      return Promise.resolve();
    }
    const start = now2() + delay;
    let fn;
    task = loop2((now22) => {
      if (now22 < start)
        return true;
      if (!started) {
        fn = interpolate(value, new_value);
        if (typeof duration === "function")
          duration = duration(value, new_value);
        started = true;
      }
      if (previous_task) {
        previous_task.abort();
        previous_task = null;
      }
      const elapsed = now22 - start;
      if (elapsed > duration) {
        store.set(value = new_value);
        return false;
      }
      store.set(value = fn(easing(elapsed / duration)));
      return true;
    });
    return task.promise;
  }
  return {
    set,
    update: (fn, opts) => set(fn(target_value, value), opts),
    subscribe: store.subscribe
  };
}
var css5, Lottery;
var init_lottery_9d0a3c39 = __esm({
  ".svelte-kit/output/server/chunks/lottery-9d0a3c39.js"() {
    init_shims();
    init_app_171d3477();
    init_index_8f6e8620();
    css5 = {
      code: '@-webkit-keyframes svelte-x259fl-loadingCircle{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}@keyframes svelte-x259fl-loadingCircle{100%{-webkit-transform:rotate(360deg);transform:rotate(360deg)}}.__react_component_tooltip.svelte-x259fl{border-radius:3px;display:inline-block;font-size:13px;left:-999em;opacity:0;padding:8px 21px;position:fixed;pointer-events:none;transition:opacity 0.3s ease-out;top:-999em;visibility:hidden;z-index:999}.__react_component_tooltip.allow_click.svelte-x259fl{pointer-events:auto}.__react_component_tooltip.svelte-x259fl::before,.__react_component_tooltip.svelte-x259fl::after{content:"";width:0;height:0;position:absolute}.__react_component_tooltip.place-top.svelte-x259fl::before{border-left:10px solid transparent;border-right:10px solid transparent;bottom:-8px;left:50%;margin-left:-10px}',
      map: null
    };
    Lottery = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let days;
      let hours;
      let minutes;
      let seconds;
      let $distance, $$unsubscribe_distance;
      var expected = new Date("2021-11-19 16:25:00").getTime();
      var now22 = new Date().getTime();
      let distance = tweened(expected - now22);
      $$unsubscribe_distance = subscribe(distance, (value) => $distance = value);
      setInterval(() => {
        if ($distance > 0) {
          set_store_value(distance, $distance -= 1e3, $distance);
        }
      }, 1e3);
      $$result.css.add(css5);
      days = Math.floor($distance / (1e3 * 60 * 60 * 24));
      hours = Math.floor($distance % (1e3 * 60 * 60 * 24) / (1e3 * 60 * 60));
      minutes = Math.floor($distance % (1e3 * 60 * 60) / (1e3 * 60));
      seconds = Math.floor($distance % (1e3 * 60) / 1e3);
      $$unsubscribe_distance();
      return `


<main><div class="${"desktop-content-wrapper flex justify-between w-full mx-auto pt-8"}"><div class="${"fixed"}" style="${"top: 138px; height: calc(100% - 138px);"}"></div>
       <div class="${"flex flex-col flex-1"}"><div class="${"grid-content p-4 sm:pt-0 sm:px-8 lg:pt-0 lg:px-10 text-inverse max-w-5xl lg:max-w-6xl w-full mx-auto lg:ml-auto"}"><div id="${"content-animation-wrapper"}" class="${"mx-auto w-full"}" style="${"opacity: 1;"}"><div style="${"opacity: 1; transform: none;"}"><div class="${"flex flex-col sm:flex-row justify-between sm:items-center mb-4 sm:mb-10"}"><div class="${"flex justify-between items-center sm:w-9/12 lg:w-7/12"}"><div class="${"flex justify-start items-center"}"><img src="${"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGYAAABmCAMAAAAOARRQAAACVVBMVEUAAABhZYRdbbJGaNdQceNlec1SbtN0frZNbdlXaK9ufMJpdbRxerJdeN1Va8FJV5N8jNt0gMBeaaRhdstud6xobphWb8tkd8Nyg8xaaalTWH1hZ5JUcNdjetRwgMpScuFLZ81UbtBWY59PbNNIZ9J3jN5gcLdTdu5qhfFlgOg9RWuEme7///80W9I0Wc0yW9U0VsU0WMkyT7AyTawxTKgyUbYyS6UyULM0VsEzU7wxSqEuWNM2Vr4wSqM0T6wySZ4XNqgvO28nVdoeOaAdN5snU9UrV9f///ksWeAkQKclPp0vPXgrV9wxSZwtTbkjRLIsR6saOqszVL82VsAdPa8gPagsRJ4bOaMeN5j8+/x1hMP7+fMfNIooSLU3TqXW2eo6YNczR5UxO2k9aO1OY7dAVrIqRaY3ZOw2YejS1OapsNakrdRhdMAWMJgjOpMbNJP29vrq6/Lb3ey9w98pPIweLG3z8/fLz+bGyuM9ZOFBZds+YtaRnM4pQqFBU5/t7vUuXOXi4uM2X92vt9yCj8p9isOnqsJqesFUabxHXLJBValHWKQ1RYcyQYDg4u/p6OiWoNLFxtGcpMldbbItSq8mN3/m5/Dv7elEaue3vd6zudadptJserlXaLFcaaYiT9O0t8yKk7wsQZYiMncpN3UbLHT18+3Fydubob4hRb2Ei65SY6pbZpk0X+LY2Ny6v9ekqsuKlseRmsQpTb94g7dqdq9QX6MPIXNHcPSssMSWm7ZyfbBNW5tQXI8YJ2XR0ddkb6VFUIYbMIK7vchveKBEU5RDXL1IIBFpAAAALHRSTlMAFX307JXOOOOLW1MdwqZxV0dAoS4Ltoh+cjAm26xg5d7FWd3mj2r0y8k+l+55VKIAAA2iSURBVGjerZr3X5NHGMCpVJCqFXerrbV2t6HYJASSkGEWSUxCkBAChFUBkRWmgAKisrcoVqggW1Hc22odHX9Xb+TGm0FxPJ8PP/De+943z3PP89zdcxfxBrJ995bNsfs27fwpZtOe2C3RH0S8f9n2UczGdScKCuKaD9sulx4+HVdwIjLq4083v0fW9tjP151oLjWagCjjkSiVJpPN1n6kIDJq57b3wlj/ceRpnQ71HyxKm+7GiahPdr8jZMPayNNmozIuGMBIJt2N41EfvQtk63EbZaxIMp/+6qN3gcQRyMoSp9S9JWgthcRxwjpmQkGfbXlTyJZ1ZgSJW6X4QWvfUJVmm5JAVk+KM5m/eAOFor8ymxjkZ7+wDklDXEALVKg5ZrWUPRehe1HGL1iEKEInTUyh9u+3r4rySfxlogjqZj+QpKWl/bQ/hr+3dG8/FNRCFDLvXU20bi018V3tT0pKdrhcPRWOe6g7IpC+9G9FgjZVnpzEgwDnw+j/pWw0GgkFQdLlqdrz3XVZoqZEB+oOC6CkuyqyREMjPRlpDgyiquoKYv+H8sNlJYFgTVK1RSNDIigtafJDSdBC2IyHHJJa9Lyp2+IHUcMZL64cqp8bCQV2lpScqy0uyxJhabQ4MAdT5GndIr/kd2e6gOmgQn59jAWbV6B8o6O6IHulOUeqRbQz53mASUqCEECRZ2aLqDT2aHOJQthu3+0KS1lzxEh0wapknxSJeEyC/BAEAcoheQLEMCl3piWncxzzunAzXuwNAcVlKSN9MIwcgKDI5YkIw2SoRwtGiHKU7RvDzMOPOUq6XNtbKxLI0ZLziZCDJSEx85JIKB3aXDRAhLM1JOZLnYCSnRXQy91McWJCAqWILW3DAW+cyUjl9DEeXh8q+M1KSkmWazsDusjpUjjV4sREQEpMAH+JYrX+j8WAl5osPEf3RfDwRF80Uk9Od2g7hN8Pd01ZLWqJWnw+Uw8k0ykWSyRO/cOu3wIM6yQcZLbPQ0R/PPHkdHkA5ber/R6DWyqVqJ2qO+MTE+MjagvASFUGz8OnpwSvNmJ9/GYrXR/eZEnJWoEPpUw/BBCFQiaVSq1+56vtKwH/yRRuj6+tK4d/uy4D+lsYs33w4WVGSSviR//UHwaD3a5RqGQymfU6idY7HhkQlcJu93hevhAEkFaeTs12ZE2gMsRkyamSIe6rs/2VbrsGUFQqhcL3gDwe9QEu5Gjs7srZrhTui2wtM5vuww+EytCBcWTUcQbrchs0dgSBPXoZxqtRYJBGo/H4ZnK4b4pcyUlMHaEybGA6uC+ueqxIE0wp9L5kmELCAS3WygeLvBs4kqHZiDpMGSMzWfGxIAruS1PofbRMmmYe1UMOwCDLuSsfcPq0MLPx6nxaSpWRa8+w17sMVgDBPSns3vqpu1dogNx/5q3SQIwUNbsr77PxyepNZeqs287SDFXGVcGNvhVQQD+gI4Wiqur+UREvWXXXfe480AwEcWYY50ymnKpDU8624yaijMPZyDy5zYCCBQWIr582MBmtsubhF6QqhdUzzVoqXNSpzR8HOQCvTMoflYQizfOdYyPGx6LVmgeSg0QCf4khjyWE8Qyqji7S7wRRRjoyGeP0zWm9G1BQF2oDDstgmTCoJFgAp/IBM1tPajKx2o2PcNI8TpVJLaIvLl7XywAFirpVUSsKIx0GNeW4Dbfo8zItjR0dTqA7zUrsACBmypndDTIVpgBlfheFk5N9rRKJGAh4T2GYzKHPi3OJ1YzYajts8cQBxBdoUu4HykiwlPSdZNPOi+knT84OczFiUKvFiAP8TV/OUk5aOrFaM1q+r7P5bZbOOcBtbDLwuVqt72Q+vjw4Pzc39uoa/dm1KifAYE4ep06dRQ6thlx6E3TnEyYyNFpqnJRzmYgCMRI9XXq8OLgwfwDI3KO/6SCesyAI4ritNH6PMavZ4KJg32ElDZqjNMhVJQAjxpjWJvL4WsOvQA4c+PXAwjS1DlgiQEFmM3RyoZNMMFEAE3PDj0lPZfPMqF6KKIkA41RQ+t8NAIKkYdmvTk1fCVohII7M2kdHd0RLMKbIDREbNhppbGZTm13KRBj0I6XuRor5E2MOHjw4dm0xKyclZWjSKgYQvAgB07aljh+c/XhwmjdH7PrMRjBpLTTP9JXIMAV+bKWfnp0DHIwZHPtnanlqSmNQQwwU+ItketpHTbHDPzjKx5sifvzahqIGpgCanG+VOKUUw4fNleWDDUDmEcfr9Va58yQMA9TRX0ohFulJBRjiapsjTQTD0uZtMDT4c4jRZ/NL3NvXXj4fGJtbGBscGCgs1MgkakghVrP01pA3u10kcsw7I/acMBFHK6bDdwcMjRj/SoApySMNxFmHmm7ff1j/ur7QroAYwgGYEnU+easzjbra2ohvKSa39xj1gAysDMaoPXdFwZJ19E6bdxZixBQjlqqc1PtbIIbMBWsK4oMwOecgBn6NraaiviaU6tHZqjwhRmaZoNkzTU602RHxTZySYIqqGQZrQ9SxtoVJ0bX9HjXDJEJXK2cLd4iBnMsbI9YWEAyLzpxJIUaSV1V4KzTnQr9VqI2+LBQGGM1EMD0EszhpgUajGDBlVXkvHQ3JaXKroA8wbcqY0RAGGw27ANOGGY3HwDVa/bnRoyEm0U4YoKHGphxgqAvsOc4cuoZ42n3OaCiHaAoLCwfGXtc/ezBz+8pQlmCv4ZaCV6mnWah1fwcY6tD7aHg6JMzlM3ESIEGnsAPKwMDg4NzCwsL8wPK1OkbKmrSoxfTNEim17Qhz6J18smEuP0rCEzt0q6+qyut9XT8weBDKfMOfDc8bhVZLhMoIs0B2Gpdsdn3lT52CnGaR4sFBSa017+7ExPTE6D9jAAMFTDh/Dl7gpmk648j051LY4oZLnR/sYBl6JGSGLunzB83NgTE/BXK66BgADJ3X9J3CRQeZCCJiSpVkvulmc3QGm2/0d9jkiSgI03CVYvRq/Cb0FT11tHwJmgjwtMZP0rnFx7jcCdRBomZTyF8NgIEpvzZMc0ZD8yyePYcFC08cNlFkyYEwcgv1gSutKroW0NMyQ87zR4Sz8DyHuoCeLm1kbLoRdbAEjeoQe20rr2xK8qjz3Hz1aG5sfn5+buHVTZo/r1vUmCLhF2pZRfysBmRH6HWaFHPActBQxrbuT5dfDQ4OPH86zLJNq0StRhQpb7NGpxxi2HJwDfEBEKA0EQ+3WQAGi36S374Pn7p5it+iXzKoAQZRFPoZEb+w2c8vbnc1szU0m/Wv0jW0ROoh6oTce0jplsCqOMVtCdJZRkMSpSNWgzsCtohWYH2kklZNbdilOpgI2M5jhtEz5HRo9mEMsxq/v3niUaFdlEQK1sb9F0JTqic9avxboMnYyIi6kZ+hqCHbqF0XkUuH363J8jxt+SEntes+uCvEFLdhmivxOZKozegW18y2a3Ui5gV6wJFBDODM3g3aFqaU2X34h0CKBu2lWdDQ/cB6umE/rKTq9ATspFX+rb/b13Y3n6+Z1JRf91rhjh3vpDWGh7+xOQgpQzbsrPygC10X8LSyuoCmylv/7BpRqfZlIagLaHD9AVEUN7mNNFOGlR+YE6Aqx0muyuFrZbUUjX32dT1xhVuP6u0aqqtGY7Cf5YqRWrqPNpFiClMnuJiW8tQHqim0MmSv/6eGJD2w4gTPAQa1GDQcpRoVOX5hyvDqkNhxZI5znCezqAKF61ya2TaGQU9lGF/Z9iJkpYtVhpg6eK6G9TQ+GM+2VboBCHOs/cSiTbPQCwEFQKyVU6eEdTsSM1QZ6mxHlGGrg1VAITwMblogKPfIoEBVDNaZRUG1M5dWIYNrtxtx7ODh6RaEx1/PfAY3wADPJXuQk70WCQoWt8EzdVbg52JWU1WSkiqTXY+NtD4sJ25A0/+zKr0KVm7VlsnysvKy33stKCW3gtJt16JgT1KURimsQMx7ATUb5HSKhKAnU9YSWIcWZ2TCOrQF7rAlFutUQCH6ZBEa/jAmY2ZjtfvAqvrVVifdZuLlW0b/XznCl2p60+gpQXDxnmRQI8+pCMhhKTMZYjE5I4AgZx6OeyZDkMJq6lvDHKw85jjJ2uL84BMP+UonHuNOF0cx/xAEoF7Nc1yW8pXObxL0QrtmdWhTMYUeE4WTGOgG2N/QaVTFkBADIElIICZTgMkvEpwS6b7bvdIRnlkpPFtrOSbE8GdrndzYd1hcyenoVHLFIzw2wyn5k0KHtri8muQX7qQwSXBSWD3i1PJHkvRAMrzsaDcFnHsWt9T4Z0Q5hNATSTJlDI0Uw9Mu4sj0eHVlWVtqZIeSEJSrlXSfqRadyb3HTnFRi6sFKDLe7YRDz1Rhh8Ury6bDOsIBIGQ6V9q/PblBZ9JJqRUdRVoXNBdoYpS9G1Z5kK9TMhA+Gr635Gfg5/6WJdcS1IM/+DaawUH+6mTbZ+3GOAoKvC5AWmgTB1HqLsZErF5iiELhbz+wFtZkLN0bHfEmEr3XbAy6U7HyA3TD4u0uwKxe0AWY6Le5zoNAYe7ZCAjxGIJC8i1BtlVeTsKQtwZ93fz/V61Kj38JIO8mm7dGnrbpTMoQrDglvs61Zvd7uqIGrsEd0dlMJhNRId5ksunM5Brce5Pd62N2oEt98e26y+3muIL3f6mPsaK3xO75dOc3a76NXf9mVxT/Axd3kX4AdE9pAAAAAElFTkSuQmCC"}" class="${"inline-block rounded-full w-12 h-12 sm:w-16 sm:h-16 lg:w-18 lg:h-18 mr-2"}" alt="${"token icon"}">
                            <div class="${"ml-1 sm:ml-6"}"><div class="${"flex flex-col items-start justify-between leading-none w-full"}"><div class="${"inline-flex items-center text-left text-xl sm:text-3xl font-bold text-accent-2 relative"}">USDC Pool
                                  
                                  </div></div></div></div></div></div>
                   <div class="${"custom-prize-box-padding pink-purple-gradient rounded-lg px-4 xs:px-6 sm:px-16 py-8 sm:pt-12 sm:pb-10 text-white my-4 mx-auto"}" style="${"min-height: 150px;"}"><div class="${"flex flex-col xs:flex-row xs:items-center justify-between"}"><div class="${"w-1/2 sm:w-7/12"}"><h6 class="${"font-normal text-inverse opacity-60"}">Premio #43</h6>
                            <h1 class="${"text-5xl xs:text-4xl sm:text-6xl lg:text-7xl -mt-3 xs:mt-0 sm:-mt-3 flex"}">$<span>50,247 </span></h1></div>
                         <div class="${"flex flex-col justify-center pt-4 xs:pt-2 sm:pt-0 countdown-wrapper"}"><h6 class="${"relative font-normal mb-1 xs:mb-2 sm:-mt-3 opacity-60 text-inverse"}">Verr\xE0 aggiudicato</h6>
                            <div class="${"flex text-center text-sm xs:text-xs sm:text-base"}"><div class="${"flex flex-col sm:mr-2"}" style="${"padding-left: 2px; padding-right: 2px;"}"><div class="${"flex"}"><span class="${"bg-tertiary text-green font-bold rounded-sm"}" style="${"padding: 2px 8px; margin: 0px 1px;"}">${escape(days)}</span></div>
                                  <div class="${"opacity-60 text-inverse text-xxxs"}" style="${"padding-top: 3px;"}">DAYS</div></div>
                               <div class="${"flex flex-col"}" style="${"padding-left: 2px; padding-right: 2px;"}"><div class="${"flex"}"><span class="${"bg-tertiary text-green font-bold rounded-sm"}" style="${"padding: 2px 8px; margin: 0px 1px;"}">${escape(hours)}</span></div>
                                  <div class="${"opacity-60 text-inverse text-xxxs"}" style="${"padding-top: 3px;"}">H</div></div>
                               <div class="${"px-0 sm:px-1 font-bold text-green"}">:</div>
                               <div class="${"flex flex-col"}" style="${"padding-left: 1px; padding-right: 2px;"}"><div class="${"flex"}"><span class="${"bg-tertiary text-green font-bold rounded-sm"}" style="${"padding: 2px 8px; margin: 0px 1px;"}">${escape(minutes)}</span></div>
                                  <div class="${"opacity-60 text-inverse text-xxxs"}" style="${"padding-top: 3px;"}">M</div></div>
                               <div class="${"px-0 sm:px-1 font-bold text-green"}">:</div>
                               <div class="${"flex flex-col"}" style="${"padding-left: 1px; padding-right: 2px;"}"><div class="${"flex"}"><span class="${"bg-tertiary text-green font-bold rounded-sm"}" style="${"padding: 2px 8px; margin: 0px 1px;"}">${escape(seconds)}</span></div>
                                  <div class="${"opacity-60 text-inverse text-xxxs"}" style="${"padding-top: 3px;"}">S</div></div></div></div></div></div>
                   <div class="${"non-interactable-card bg-card rounded-lg my-4 py-4 xs:py-6 px-4 xs:px-6 sm:px-10"}"><h3 class="${"text-center"}">USDC Premio #43</h3>
                      <p class="${"mx-auto text-accent-1 text-center"}">Premio condiviso tra 5 vincitori.</p>
                      <div class="${"flex flex-row"}"><div class="${"hidden sm:block sm:w-2/12"}">\xA0</div>
                         <div class="${"flex flex-col items-center justify-center text-center w-full h-56 xs:h-64 xs:w-5/12"}"><img alt="${"token"}" src="${"https://app.pooltogether.com/_next/static/images/prize-illustration-new@2x-d8db8bf9ce4d0f63011f8fcdeb0cb78a.png"}" class="${"w-40 mx-auto"}">
                            <div><h4 class="${"text-xl xs:text-2xl sm:text-3xl lg:text-4xl"}">$24,002</h4></div></div>
                         <div class="${"w-full xs:w-2/12 text-center my-auto text-5xl font-bold leading-none"}">+ </div>
                         <div class="${"flex flex-col items-center justify-center text-center w-full xs:w-5/12 h-56 xs:h-64"}"><img alt="${"bnb "}" src="${"https://app.pooltogether.com/_next/static/images/lootbox-closed-halo@2x-4b9c9d0d43b339def5ce972068dbc825.png"}" class="${"w-40 mx-auto -mt-8"}">
                            <div class="${"relative"}" style="${"top: 3px;"}"><h4 class="${"text-xl xs:text-2xl sm:text-3xl lg:text-4xl"}">$26,244</h4></div></div>
                         <div class="${"hidden sm:block sm:w-2/12"}">\xA0</div></div>
                      <ul class="${"text-inverse rounded-lg p-0 xs:py-4 mt-4 flex flex-col text-xs xs:text-base sm:text-lg"}"><li class="${"flex justify-between mb-2"}"><span class="${"text-accent-1"}">Primo premio</span><span class="${"flex flex-col xs:flex-row text-right xs:text-left"}"><span>$<span>10,049 </span></span></span></li>
                         <li class="${"flex justify-between mb-2 last:mb-0 "}"><span class="${"text-accent-1"}">Altri classificati</span><span>$<span>10,049 </span></span></li>
                         <li class="${"flex justify-between mb-2 last:mb-0 "}"><span class="${"text-accent-1"}">Altri classificati</span><span>$<span>10,049 </span></span></li>
                         <li class="${"flex justify-between mb-2 last:mb-0 "}"><span class="${"text-accent-1"}">Altri classificati</span><span>$<span>10,049 </span></span></li>
                         <li class="${"flex justify-between mb-2 last:mb-0 "}"><span class="${"text-accent-1"}">Altri classificati</span><span>$<span>10,049 </span></span></li></ul></div>
                   <div class="${"non-interactable-card bg-card rounded-lg my-4 py-4 xs:py-6 px-4 xs:px-6 sm:px-10"}"><div class="${"text-accent-2 opacity-90 font-headline uppercase xs:text-sm"}">Loot Box</div>
                      <div class="${"flex flex-col sm:flex-row justify-between sm:items-center mb-4"}"><div class="${"flex"}"><h3>$<span>26,244<span class="${"opacity-40"}">.32</span><span class="${"opacity-40"}"></span></span></h3>
                            <span data-tip="${"true"}" data-for="${"lootbox-extra-info-tooltip-tooltip"}" class="${"inline cursor-pointer ml-2 my-auto text-inverse hover:opacity-70"}" currentitem="${"false"}"><svg width="${"24"}" height="${"24"}" viewBox="${"0 0 24 24"}" fill="${"none"}" stroke="${"currentColor"}" stroke-width="${"2"}" stroke-linecap="${"round"}" stroke-linejoin="${"round"}" class="${"feather feather-info w-4 h-4"}"><g><circle cx="${"12"}" cy="${"12"}" r="${"10"}"></circle><line x1="${"12"}" y1="${"16"}" x2="${"12"}" y2="${"12"}"></line><line x1="${"12"}" y1="${"8"}" x2="${"12"}" y2="${"8"}"></line></g></svg></span>
                            <div class="${"__react_component_tooltip t463fe51a-56d0-4911-8644-a313fd29aae3 place-top type-dark allow_click svelte-x259fl"}" id="${"lootbox-extra-info-tooltip-tooltip"}" data-id="${"tooltip"}"><style aria-hidden="${"true"}">.t463fe51a-56d0-4911-8644-a313fd29aae3 {
                                  color: #fff;
                                  background: #222;
                                  border: 1px solid transparent;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-top {
                                  margin-top: -10px;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-top::before {
                                  border-top: 8px solid transparent;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-top::after {
                                  border-left: 8px solid transparent;
                                  border-right: 8px solid transparent;
                                  bottom: -6px;
                                  left: 50%;
                                  margin-left: -8px;
                                  border-top-color: #222;
                                  border-top-style: solid;
                                  border-top-width: 6px;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-bottom {
                                  margin-top: 10px;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-bottom::before {
                                  border-bottom: 8px solid transparent;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-bottom::after {
                                  border-left: 8px solid transparent;
                                  border-right: 8px solid transparent;
                                  top: -6px;
                                  left: 50%;
                                  margin-left: -8px;
                                  border-bottom-color: #222;
                                  border-bottom-style: solid;
                                  border-bottom-width: 6px;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-left {
                                  margin-left: -10px;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-left::before {
                                  border-left: 8px solid transparent;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-left::after {
                                  border-top: 5px solid transparent;
                                  border-bottom: 5px solid transparent;
                                  right: -6px;
                                  top: 50%;
                                  margin-top: -4px;
                                  border-left-color: #222;
                                  border-left-style: solid;
                                  border-left-width: 6px;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-right {
                                  margin-left: 10px;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-right::before {
                                  border-right: 8px solid transparent;
                                  }
                                  .t463fe51a-56d0-4911-8644-a313fd29aae3.place-right::after {
                                  border-top: 5px solid transparent;
                                  border-bottom: 5px solid transparent;
                                  left: -6px;
                                  top: 50%;
                                  margin-top: -4px;
                                  border-right-color: #222;
                                  border-right-style: solid;
                                  border-right-width: 6px;
                                  }
                               </style>
                               <button class="${"ml-auto mb-2 block xs:hidden"}"><svg width="${"24"}" height="${"24"}" viewBox="${"0 0 24 24"}" fill="${"none"}" stroke="${"currentColor"}" stroke-width="${"2"}" stroke-linecap="${"round"}" stroke-linejoin="${"round"}" class="${"feather feather-x w-4 h-4 text-inverse"}"><g><line x1="${"18"}" y1="${"6"}" x2="${"6"}" y2="${"18"}"></line><line x1="${"6"}" y1="${"6"}" x2="${"18"}" y2="${"18"}"></line></g></svg></button>
                               Il valore del loot box \xE8 stimato sul tasso d&#39;interesse attuale della fonte d&#39;interessi a qualsiasi token aggiunto (es. COMP)
                            </div></div>
                         <div><button aria-haspopup="${"true"}" aria-controls="${"menu--41"}" class="${"mt-2 xs:mt-0 text-xs inline-flex items-center justify-center trans font-bold text-accent-1 hover:undefined"}" id="${"menu-button--menu--41"}" type="${"button"}" data-reach-menu-button="${""}">Contribuisci al Loot Box 
                               <svg width="${"24"}" height="${"24"}" viewBox="${"0 0 24 24"}" fill="${"none"}" stroke="${"currentColor"}" stroke-width="${"0.15rem"}" stroke-linecap="${"round"}" stroke-linejoin="${"round"}" class="${"feather feather-chevron-down relative w-4 h-4 inline-block ml-2"}"><g><polyline points="${"6 9 12 15 18 9"}"></polyline></g></svg></button></div></div>
                      <ul class="${"text-inverse rounded-lg p-0 xs:py-4 mt-4 flex flex-col text-xs xs:text-base sm:text-lg"}"><h6 class="${"text-green mb-4"}">1 Tokens</h6>
                         <li class="${"w-full flex text-xxs sm:text-base mb-2 last:mb-0"}"><span class="${"flex w-1/3 text-left"}"><a href="${"https://etherscan.io/address/0xc00e94cb662c3520282e6f5717214004a7f26888"}" class="${"trans hover:text-highlight-1 truncate text-accent-1 flex items-center inline-flex"}" target="${"_blank"}" rel="${"noopener noreferrer"}" title="${"View on Block Explorer"}"><img src="${"data:image/svg+xml,%3Csvg%20width%3D%2296%22%20height%3D%2296%22%20viewBox%3D%220%200%2096%2096%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3Cg%20clip-path%3D%22url%28%23clip0%29%22%3E%3Cg%20filter%3D%22url%28%23filter0_i%29%22%3E%3Cpath%20d%3D%22M48.0743%2095.2518C74.1504%2095.2518%2095.2892%2074.113%2095.2892%2048.0369C95.2892%2021.9609%2074.1504%200.822021%2048.0743%200.822021C21.9982%200.822021%200.859375%2021.9609%200.859375%2048.0369C0.859375%2074.113%2021.9982%2095.2518%2048.0743%2095.2518Z%22%20fill%3D%22%2300D395%22%2F%3E%3C%2Fg%3E%3Cpath%20d%3D%22M48.0745%2091.7325C72.2069%2091.7325%2091.7701%2072.1693%2091.7701%2048.0369C91.7701%2023.9045%2072.2069%204.34131%2048.0745%204.34131C23.9421%204.34131%204.37891%2023.9045%204.37891%2048.0369C4.37891%2072.1693%2023.9421%2091.7325%2048.0745%2091.7325Z%22%20fill%3D%22url%28%23paint0_linear%29%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M28.1549%2063.8801C26.7427%2063.0164%2025.8789%2061.4781%2025.8789%2059.8262V50.6025C25.8789%2050.2495%2025.9735%2049.909%2026.15%2049.6064C26.6985%2048.6607%2027.9153%2048.3391%2028.8611%2048.894L49.6794%2061.0304C50.8962%2061.7429%2051.6465%2063.0416%2051.6465%2064.4539V74.0117C51.6465%2074.4467%2051.5267%2074.8818%2051.2997%2075.2537C50.6125%2076.376%2049.1498%2076.729%2048.0275%2076.0418L28.1549%2063.8801ZM59.187%2046.3658C60.4038%2047.0782%2061.1541%2048.377%2061.1541%2049.7892V69.1824C61.1541%2069.7561%2060.8451%2070.2857%2060.3471%2070.5631L55.7887%2073.1291C55.732%2073.1606%2055.6689%2073.1858%2055.6059%2073.2047V62.4364C55.6059%2061.043%2054.8745%2059.7506%2053.6766%2059.0318L35.3928%2048.0933V35.9379C35.3928%2035.5848%2035.4874%2035.2444%2035.6639%2034.9417C36.2124%2033.996%2037.4292%2033.6745%2038.375%2034.2293L59.187%2046.3658ZM68.2974%2032.0416C69.5205%2032.7477%2070.2708%2034.0591%2070.2708%2035.4713V63.7982C70.2708%2064.3782%2069.9492%2064.9141%2069.4385%2065.1915L65.1198%2067.5242V47.8032C65.1198%2046.4099%2064.3884%2045.1238%2063.1968%2044.405L44.5095%2033.1953V21.6641C44.5095%2021.3111%2044.6041%2020.9706%2044.7743%2020.668C45.3228%2019.7223%2046.5396%2019.4007%2047.4853%2019.9493L68.2974%2032.0416Z%22%20fill%3D%22%23F9FAFB%22%2F%3E%3Cpath%20d%3D%22M48.0371%2096C74.5263%2096%2096%2074.5263%2096%2048.0371C96%2021.5479%2074.5263%200.0742188%2048.0371%200.0742188C21.5479%200.0742188%200.0742188%2021.5479%200.0742188%2048.0371C0.0742188%2074.5263%2021.5479%2096%2048.0371%2096Z%22%20fill%3D%22%23070A0E%22%2F%3E%3Cpath%20fill-rule%3D%22evenodd%22%20clip-rule%3D%22evenodd%22%20d%3D%22M27.8013%2064.1309C26.3667%2063.2534%2025.4893%2061.6907%2025.4893%2060.0127V50.6429C25.4893%2050.2842%2025.5853%2049.9384%2025.7647%2049.631C26.3219%2048.6703%2027.558%2048.3437%2028.5187%2048.9073L49.6668%2061.236C50.9029%2061.9597%2051.665%2063.2791%2051.665%2064.7137V74.4229C51.665%2074.8649%2051.5434%2075.3068%2051.3128%2075.6846C50.6147%2076.8246%2049.1288%2077.1833%2047.9888%2076.4852L27.8013%2064.1309ZM59.325%2046.339C60.5611%2047.0628%2061.3233%2048.3821%2061.3233%2049.8167V69.5171C61.3233%2070.0999%2061.0094%2070.6379%2060.5035%2070.9197L55.8729%2073.5263C55.8153%2073.5583%2055.7512%2073.584%2055.6872%2073.6032V62.6642C55.6872%2061.2488%2054.9442%2059.9359%2053.7273%2059.2058L35.1539%2048.0939V35.7459C35.1539%2035.3873%2035.2499%2035.0414%2035.4293%2034.734C35.9865%2033.7733%2037.2226%2033.4467%2038.1833%2034.0103L59.325%2046.339ZM68.5797%2031.7879C69.8222%2032.5052%2070.5844%2033.8374%2070.5844%2035.272V64.0476C70.5844%2064.6368%2070.2577%2065.1812%2069.739%2065.463L65.3518%2067.8327V47.7993C65.3518%2046.3839%2064.6088%2045.0774%2063.3984%2044.3472L44.415%2032.96V21.2461C44.415%2020.8874%2044.5111%2020.5416%2044.684%2020.2341C45.2412%2019.2735%2046.4773%2018.9468%2047.438%2019.504L68.5797%2031.7879Z%22%20fill%3D%22%2300D395%22%2F%3E%3C%2Fg%3E%3Cdefs%3E%3Cfilter%20id%3D%22filter0_i%22%20x%3D%220.859375%22%20y%3D%220.592313%22%20width%3D%2294.4298%22%20height%3D%2294.6595%22%20filterUnits%3D%22userSpaceOnUse%22%20color-interpolation-filters%3D%22sRGB%22%3E%3CfeFlood%20flood-opacity%3D%220%22%20result%3D%22BackgroundImageFix%22%2F%3E%3CfeBlend%20mode%3D%22normal%22%20in%3D%22SourceGraphic%22%20in2%3D%22BackgroundImageFix%22%20result%3D%22shape%22%2F%3E%3CfeColorMatrix%20in%3D%22SourceAlpha%22%20type%3D%22matrix%22%20values%3D%220%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%200%20127%200%22%20result%3D%22hardAlpha%22%2F%3E%3CfeOffset%20dy%3D%22-0.689125%22%2F%3E%3CfeGaussianBlur%20stdDeviation%3D%220.114854%22%2F%3E%3CfeComposite%20in2%3D%22hardAlpha%22%20operator%3D%22arithmetic%22%20k2%3D%22-1%22%20k3%3D%221%22%2F%3E%3CfeColorMatrix%20type%3D%22matrix%22%20values%3D%220%200%200%200%200.0699479%200%200%200%200%200.9875%200%200%200%200%200.717887%200%200%200%201%200%22%2F%3E%3CfeBlend%20mode%3D%22normal%22%20in2%3D%22shape%22%20result%3D%22effect1_innerShadow%22%2F%3E%3C%2Ffilter%3E%3ClinearGradient%20id%3D%22paint0_linear%22%20x1%3D%2248.0745%22%20y1%3D%224.34131%22%20x2%3D%2248.0745%22%20y2%3D%2291.7325%22%20gradientUnits%3D%22userSpaceOnUse%22%3E%3Cstop%20stop-color%3D%22%23141E27%22%2F%3E%3Cstop%20offset%3D%221%22%20stop-color%3D%22%23141E27%22%2F%3E%3C%2FlinearGradient%3E%3CclipPath%20id%3D%22clip0%22%3E%3Crect%20width%3D%2296%22%20height%3D%2296%22%20fill%3D%22white%22%2F%3E%3C%2FclipPath%3E%3C%2Fdefs%3E%3C%2Fsvg%3E"}" class="${"inline-block rounded-full mr-2 w-5 h-5"}" alt="${"token icon"}"> Compound 
                                  <svg width="${"24"}" height="${"24"}" viewBox="${"0 0 24 24"}" fill="${"none"}" stroke="${"currentColor"}" stroke-width="${"2"}" stroke-linecap="${"round"}" stroke-linejoin="${"round"}" class="${"feather feather-arrow-up-right w-4 h-4 ml-1 my-auto inline-block w-4 h-4"}"><g><line x1="${"7"}" y1="${"17"}" x2="${"17"}" y2="${"7"}"></line><polyline points="${"7 7 17 7 17 17"}"></polyline></g></svg></a></span>
                            <span class="${"w-1/3 sm:pl-6 text-right text-accent-1 truncate"}"><span>36<span class="${"opacity-40"}">.12</span><span class="${"opacity-40"}"></span></span> COMP</span><span class="${"w-1/3 text-right"}"><span>$<span>12,577<span class="${"opacity-40"}">.37</span><span class="${"opacity-40"}"></span></span></span></span></li></ul></div></div></div></div></div></div>
 </main>`;
    });
  }
});

// .svelte-kit/output/server/chunks/app-171d3477.js
function get_single_valued_header(headers, key) {
  const value = headers[key];
  if (Array.isArray(value)) {
    if (value.length === 0) {
      return void 0;
    }
    if (value.length > 1) {
      throw new Error(`Multiple headers provided for ${key}. Multiple may be provided only for set-cookie`);
    }
    return value[0];
  }
  return value;
}
function coalesce_to_error(err) {
  return err instanceof Error || err && err.name && err.message ? err : new Error(JSON.stringify(err));
}
function lowercase_keys(obj) {
  const clone2 = {};
  for (const key in obj) {
    clone2[key.toLowerCase()] = obj[key];
  }
  return clone2;
}
function error(body) {
  return {
    status: 500,
    body,
    headers: {}
  };
}
function is_string(s2) {
  return typeof s2 === "string" || s2 instanceof String;
}
function is_content_type_textual(content_type) {
  if (!content_type)
    return true;
  const [type] = content_type.split(";");
  return type === "text/plain" || type === "application/json" || type === "application/x-www-form-urlencoded" || type === "multipart/form-data";
}
async function render_endpoint(request, route, match) {
  const mod = await route.load();
  const handler = mod[request.method.toLowerCase().replace("delete", "del")];
  if (!handler) {
    return;
  }
  const params = route.params(match);
  const response = await handler({ ...request, params });
  const preface = `Invalid response from route ${request.path}`;
  if (!response) {
    return;
  }
  if (typeof response !== "object") {
    return error(`${preface}: expected an object, got ${typeof response}`);
  }
  let { status = 200, body, headers = {} } = response;
  headers = lowercase_keys(headers);
  const type = get_single_valued_header(headers, "content-type");
  const is_type_textual = is_content_type_textual(type);
  if (!is_type_textual && !(body instanceof Uint8Array || is_string(body))) {
    return error(`${preface}: body must be an instance of string or Uint8Array if content-type is not a supported textual content-type`);
  }
  let normalized_body;
  if ((typeof body === "object" || typeof body === "undefined") && !(body instanceof Uint8Array) && (!type || type.startsWith("application/json"))) {
    headers = { ...headers, "content-type": "application/json; charset=utf-8" };
    normalized_body = JSON.stringify(typeof body === "undefined" ? {} : body);
  } else {
    normalized_body = body;
  }
  return { status, body: normalized_body, headers };
}
function devalue(value) {
  var counts = new Map();
  function walk(thing) {
    if (typeof thing === "function") {
      throw new Error("Cannot stringify a function");
    }
    if (counts.has(thing)) {
      counts.set(thing, counts.get(thing) + 1);
      return;
    }
    counts.set(thing, 1);
    if (!isPrimitive(thing)) {
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
        case "Date":
        case "RegExp":
          return;
        case "Array":
          thing.forEach(walk);
          break;
        case "Set":
        case "Map":
          Array.from(thing).forEach(walk);
          break;
        default:
          var proto = Object.getPrototypeOf(thing);
          if (proto !== Object.prototype && proto !== null && Object.getOwnPropertyNames(proto).sort().join("\0") !== objectProtoOwnPropertyNames) {
            throw new Error("Cannot stringify arbitrary non-POJOs");
          }
          if (Object.getOwnPropertySymbols(thing).length > 0) {
            throw new Error("Cannot stringify POJOs with symbolic keys");
          }
          Object.keys(thing).forEach(function(key) {
            return walk(thing[key]);
          });
      }
    }
  }
  walk(value);
  var names = new Map();
  Array.from(counts).filter(function(entry) {
    return entry[1] > 1;
  }).sort(function(a, b) {
    return b[1] - a[1];
  }).forEach(function(entry, i) {
    names.set(entry[0], getName(i));
  });
  function stringify(thing) {
    if (names.has(thing)) {
      return names.get(thing);
    }
    if (isPrimitive(thing)) {
      return stringifyPrimitive(thing);
    }
    var type = getType(thing);
    switch (type) {
      case "Number":
      case "String":
      case "Boolean":
        return "Object(" + stringify(thing.valueOf()) + ")";
      case "RegExp":
        return "new RegExp(" + stringifyString(thing.source) + ', "' + thing.flags + '")';
      case "Date":
        return "new Date(" + thing.getTime() + ")";
      case "Array":
        var members = thing.map(function(v, i) {
          return i in thing ? stringify(v) : "";
        });
        var tail = thing.length === 0 || thing.length - 1 in thing ? "" : ",";
        return "[" + members.join(",") + tail + "]";
      case "Set":
      case "Map":
        return "new " + type + "([" + Array.from(thing).map(stringify).join(",") + "])";
      default:
        var obj = "{" + Object.keys(thing).map(function(key) {
          return safeKey(key) + ":" + stringify(thing[key]);
        }).join(",") + "}";
        var proto = Object.getPrototypeOf(thing);
        if (proto === null) {
          return Object.keys(thing).length > 0 ? "Object.assign(Object.create(null)," + obj + ")" : "Object.create(null)";
        }
        return obj;
    }
  }
  var str = stringify(value);
  if (names.size) {
    var params_1 = [];
    var statements_1 = [];
    var values_1 = [];
    names.forEach(function(name, thing) {
      params_1.push(name);
      if (isPrimitive(thing)) {
        values_1.push(stringifyPrimitive(thing));
        return;
      }
      var type = getType(thing);
      switch (type) {
        case "Number":
        case "String":
        case "Boolean":
          values_1.push("Object(" + stringify(thing.valueOf()) + ")");
          break;
        case "RegExp":
          values_1.push(thing.toString());
          break;
        case "Date":
          values_1.push("new Date(" + thing.getTime() + ")");
          break;
        case "Array":
          values_1.push("Array(" + thing.length + ")");
          thing.forEach(function(v, i) {
            statements_1.push(name + "[" + i + "]=" + stringify(v));
          });
          break;
        case "Set":
          values_1.push("new Set");
          statements_1.push(name + "." + Array.from(thing).map(function(v) {
            return "add(" + stringify(v) + ")";
          }).join("."));
          break;
        case "Map":
          values_1.push("new Map");
          statements_1.push(name + "." + Array.from(thing).map(function(_a) {
            var k = _a[0], v = _a[1];
            return "set(" + stringify(k) + ", " + stringify(v) + ")";
          }).join("."));
          break;
        default:
          values_1.push(Object.getPrototypeOf(thing) === null ? "Object.create(null)" : "{}");
          Object.keys(thing).forEach(function(key) {
            statements_1.push("" + name + safeProp(key) + "=" + stringify(thing[key]));
          });
      }
    });
    statements_1.push("return " + str);
    return "(function(" + params_1.join(",") + "){" + statements_1.join(";") + "}(" + values_1.join(",") + "))";
  } else {
    return str;
  }
}
function getName(num) {
  var name = "";
  do {
    name = chars[num % chars.length] + name;
    num = ~~(num / chars.length) - 1;
  } while (num >= 0);
  return reserved.test(name) ? name + "_" : name;
}
function isPrimitive(thing) {
  return Object(thing) !== thing;
}
function stringifyPrimitive(thing) {
  if (typeof thing === "string")
    return stringifyString(thing);
  if (thing === void 0)
    return "void 0";
  if (thing === 0 && 1 / thing < 0)
    return "-0";
  var str = String(thing);
  if (typeof thing === "number")
    return str.replace(/^(-)?0\./, "$1.");
  return str;
}
function getType(thing) {
  return Object.prototype.toString.call(thing).slice(8, -1);
}
function escapeUnsafeChar(c) {
  return escaped$1[c] || c;
}
function escapeUnsafeChars(str) {
  return str.replace(unsafeChars, escapeUnsafeChar);
}
function safeKey(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? key : escapeUnsafeChars(JSON.stringify(key));
}
function safeProp(key) {
  return /^[_$a-zA-Z][_$a-zA-Z0-9]*$/.test(key) ? "." + key : "[" + escapeUnsafeChars(JSON.stringify(key)) + "]";
}
function stringifyString(str) {
  var result = '"';
  for (var i = 0; i < str.length; i += 1) {
    var char = str.charAt(i);
    var code = char.charCodeAt(0);
    if (char === '"') {
      result += '\\"';
    } else if (char in escaped$1) {
      result += escaped$1[char];
    } else if (code >= 55296 && code <= 57343) {
      var next2 = str.charCodeAt(i + 1);
      if (code <= 56319 && (next2 >= 56320 && next2 <= 57343)) {
        result += char + str[++i];
      } else {
        result += "\\u" + code.toString(16).toUpperCase();
      }
    } else {
      result += char;
    }
  }
  result += '"';
  return result;
}
function noop$1() {
}
function safe_not_equal$1(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function writable2(value, start = noop$1) {
  let stop;
  const subscribers = new Set();
  function set(new_value) {
    if (safe_not_equal$1(value, new_value)) {
      value = new_value;
      if (stop) {
        const run_queue = !subscriber_queue2.length;
        for (const subscriber of subscribers) {
          subscriber[1]();
          subscriber_queue2.push(subscriber, value);
        }
        if (run_queue) {
          for (let i = 0; i < subscriber_queue2.length; i += 2) {
            subscriber_queue2[i][0](subscriber_queue2[i + 1]);
          }
          subscriber_queue2.length = 0;
        }
      }
    }
  }
  function update22(fn) {
    set(fn(value));
  }
  function subscribe2(run2, invalidate = noop$1) {
    const subscriber = [run2, invalidate];
    subscribers.add(subscriber);
    if (subscribers.size === 1) {
      stop = start(set) || noop$1;
    }
    run2(value);
    return () => {
      subscribers.delete(subscriber);
      if (subscribers.size === 0) {
        stop();
        stop = null;
      }
    };
  }
  return { set, update: update22, subscribe: subscribe2 };
}
function hash(value) {
  let hash2 = 5381;
  let i = value.length;
  if (typeof value === "string") {
    while (i)
      hash2 = hash2 * 33 ^ value.charCodeAt(--i);
  } else {
    while (i)
      hash2 = hash2 * 33 ^ value[--i];
  }
  return (hash2 >>> 0).toString(36);
}
function escape_json_string_in_html(str) {
  return escape$1(str, escape_json_string_in_html_dict, (code) => `\\u${code.toString(16).toUpperCase()}`);
}
function escape_html_attr(str) {
  return '"' + escape$1(str, escape_html_attr_dict, (code) => `&#${code};`) + '"';
}
function escape$1(str, dict, unicode_encoder) {
  let result = "";
  for (let i = 0; i < str.length; i += 1) {
    const char = str.charAt(i);
    const code = char.charCodeAt(0);
    if (char in dict) {
      result += dict[char];
    } else if (code >= 55296 && code <= 57343) {
      const next2 = str.charCodeAt(i + 1);
      if (code <= 56319 && next2 >= 56320 && next2 <= 57343) {
        result += char + str[++i];
      } else {
        result += unicode_encoder(code);
      }
    } else {
      result += char;
    }
  }
  return result;
}
async function render_response({
  branch,
  options: options2,
  $session,
  page_config,
  status,
  error: error2,
  page
}) {
  const css22 = new Set(options2.entry.css);
  const js = new Set(options2.entry.js);
  const styles2 = new Set();
  const serialized_data = [];
  let rendered;
  let is_private = false;
  let maxage;
  if (error2) {
    error2.stack = options2.get_stack(error2);
  }
  if (page_config.ssr) {
    branch.forEach(({ node, loaded, fetched, uses_credentials }) => {
      if (node.css)
        node.css.forEach((url2) => css22.add(url2));
      if (node.js)
        node.js.forEach((url2) => js.add(url2));
      if (node.styles)
        node.styles.forEach((content) => styles2.add(content));
      if (fetched && page_config.hydrate)
        serialized_data.push(...fetched);
      if (uses_credentials)
        is_private = true;
      maxage = loaded.maxage;
    });
    const session = writable2($session);
    const props = {
      stores: {
        page: writable2(null),
        navigating: writable2(null),
        session
      },
      page,
      components: branch.map(({ node }) => node.module.default)
    };
    for (let i = 0; i < branch.length; i += 1) {
      props[`props_${i}`] = await branch[i].loaded.props;
    }
    let session_tracking_active = false;
    const unsubscribe = session.subscribe(() => {
      if (session_tracking_active)
        is_private = true;
    });
    session_tracking_active = true;
    try {
      rendered = options2.root.render(props);
    } finally {
      unsubscribe();
    }
  } else {
    rendered = { head: "", html: "", css: { code: "", map: null } };
  }
  const include_js = page_config.router || page_config.hydrate;
  if (!include_js)
    js.clear();
  const links = options2.amp ? styles2.size > 0 || rendered.css.code.length > 0 ? `<style amp-custom>${Array.from(styles2).concat(rendered.css.code).join("\n")}</style>` : "" : [
    ...Array.from(js).map((dep) => `<link rel="modulepreload" href="${dep}">`),
    ...Array.from(css22).map((dep) => `<link rel="stylesheet" href="${dep}">`)
  ].join("\n		");
  let init2 = "";
  if (options2.amp) {
    init2 = `
		<style amp-boilerplate>body{-webkit-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-moz-animation:-amp-start 8s steps(1,end) 0s 1 normal both;-ms-animation:-amp-start 8s steps(1,end) 0s 1 normal both;animation:-amp-start 8s steps(1,end) 0s 1 normal both}@-webkit-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-moz-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-ms-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@-o-keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}@keyframes -amp-start{from{visibility:hidden}to{visibility:visible}}</style>
		<noscript><style amp-boilerplate>body{-webkit-animation:none;-moz-animation:none;-ms-animation:none;animation:none}</style></noscript>
		<script async src="https://cdn.ampproject.org/v0.js"><\/script>`;
  } else if (include_js) {
    init2 = `<script type="module">
			import { start } from ${s$1(options2.entry.file)};
			start({
				target: ${options2.target ? `document.querySelector(${s$1(options2.target)})` : "document.body"},
				paths: ${s$1(options2.paths)},
				session: ${try_serialize($session, (error3) => {
      throw new Error(`Failed to serialize session data: ${error3.message}`);
    })},
				host: ${page && page.host ? s$1(page.host) : "location.host"},
				route: ${!!page_config.router},
				spa: ${!page_config.ssr},
				trailing_slash: ${s$1(options2.trailing_slash)},
				hydrate: ${page_config.ssr && page_config.hydrate ? `{
					status: ${status},
					error: ${serialize_error(error2)},
					nodes: [
						${(branch || []).map(({ node }) => `import(${s$1(node.entry)})`).join(",\n						")}
					],
					page: {
						host: ${page && page.host ? s$1(page.host) : "location.host"}, // TODO this is redundant
						path: ${page && page.path ? try_serialize(page.path, (error3) => {
      throw new Error(`Failed to serialize page.path: ${error3.message}`);
    }) : null},
						query: new URLSearchParams(${page && page.query ? s$1(page.query.toString()) : ""}),
						params: ${page && page.params ? try_serialize(page.params, (error3) => {
      throw new Error(`Failed to serialize page.params: ${error3.message}`);
    }) : null}
					}
				}` : "null"}
			});
		<\/script>`;
  }
  if (options2.service_worker) {
    init2 += `<script>
			if ('serviceWorker' in navigator) {
				navigator.serviceWorker.register('${options2.service_worker}');
			}
		<\/script>`;
  }
  const head = [
    rendered.head,
    styles2.size && !options2.amp ? `<style data-svelte>${Array.from(styles2).join("\n")}</style>` : "",
    links,
    init2
  ].join("\n\n		");
  const body = options2.amp ? rendered.html : `${rendered.html}

			${serialized_data.map(({ url: url2, body: body2, json }) => {
    let attributes = `type="application/json" data-type="svelte-data" data-url=${escape_html_attr(url2)}`;
    if (body2)
      attributes += ` data-body="${hash(body2)}"`;
    return `<script ${attributes}>${json}<\/script>`;
  }).join("\n\n	")}
		`;
  const headers = {
    "content-type": "text/html"
  };
  if (maxage) {
    headers["cache-control"] = `${is_private ? "private" : "public"}, max-age=${maxage}`;
  }
  if (!options2.floc) {
    headers["permissions-policy"] = "interest-cohort=()";
  }
  return {
    status,
    headers,
    body: options2.template({ head, body })
  };
}
function try_serialize(data, fail) {
  try {
    return devalue(data);
  } catch (err) {
    if (fail)
      fail(coalesce_to_error(err));
    return null;
  }
}
function serialize_error(error2) {
  if (!error2)
    return null;
  let serialized = try_serialize(error2);
  if (!serialized) {
    const { name, message, stack } = error2;
    serialized = try_serialize({ ...error2, name, message, stack });
  }
  if (!serialized) {
    serialized = "{}";
  }
  return serialized;
}
function normalize(loaded) {
  const has_error_status = loaded.status && loaded.status >= 400 && loaded.status <= 599 && !loaded.redirect;
  if (loaded.error || has_error_status) {
    const status = loaded.status;
    if (!loaded.error && has_error_status) {
      return {
        status: status || 500,
        error: new Error()
      };
    }
    const error2 = typeof loaded.error === "string" ? new Error(loaded.error) : loaded.error;
    if (!(error2 instanceof Error)) {
      return {
        status: 500,
        error: new Error(`"error" property returned from load() must be a string or instance of Error, received type "${typeof error2}"`)
      };
    }
    if (!status || status < 400 || status > 599) {
      console.warn('"error" returned from load() without a valid status code \u2014 defaulting to 500');
      return { status: 500, error: error2 };
    }
    return { status, error: error2 };
  }
  if (loaded.redirect) {
    if (!loaded.status || Math.floor(loaded.status / 100) !== 3) {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be accompanied by a 3xx status code')
      };
    }
    if (typeof loaded.redirect !== "string") {
      return {
        status: 500,
        error: new Error('"redirect" property returned from load() must be a string')
      };
    }
  }
  if (loaded.context) {
    throw new Error('You are returning "context" from a load function. "context" was renamed to "stuff", please adjust your code accordingly.');
  }
  return loaded;
}
async function load_node({
  request,
  options: options2,
  state,
  route,
  page,
  node,
  $session,
  stuff,
  prerender_enabled,
  is_leaf,
  is_error,
  status,
  error: error2
}) {
  const { module: module2 } = node;
  let uses_credentials = false;
  const fetched = [];
  let set_cookie_headers = [];
  let loaded;
  const page_proxy = new Proxy(page, {
    get: (target, prop, receiver) => {
      if (prop === "query" && prerender_enabled) {
        throw new Error("Cannot access query on a page with prerendering enabled");
      }
      return Reflect.get(target, prop, receiver);
    }
  });
  if (module2.load) {
    const load_input = {
      page: page_proxy,
      get session() {
        uses_credentials = true;
        return $session;
      },
      fetch: async (resource, opts = {}) => {
        let url2;
        if (typeof resource === "string") {
          url2 = resource;
        } else {
          url2 = resource.url;
          opts = {
            method: resource.method,
            headers: resource.headers,
            body: resource.body,
            mode: resource.mode,
            credentials: resource.credentials,
            cache: resource.cache,
            redirect: resource.redirect,
            referrer: resource.referrer,
            integrity: resource.integrity,
            ...opts
          };
        }
        const resolved = resolve(request.path, url2.split("?")[0]);
        let response;
        const prefix = options2.paths.assets || options2.paths.base;
        const filename = (resolved.startsWith(prefix) ? resolved.slice(prefix.length) : resolved).slice(1);
        const filename_html = `${filename}/index.html`;
        const asset = options2.manifest.assets.find((d) => d.file === filename || d.file === filename_html);
        if (asset) {
          response = options2.read ? new Response(options2.read(asset.file), {
            headers: asset.type ? { "content-type": asset.type } : {}
          }) : await fetch(`http://${page.host}/${asset.file}`, opts);
        } else if (resolved.startsWith("/") && !resolved.startsWith("//")) {
          const relative = resolved;
          const headers = {
            ...opts.headers
          };
          if (opts.credentials !== "omit") {
            uses_credentials = true;
            headers.cookie = request.headers.cookie;
            if (!headers.authorization) {
              headers.authorization = request.headers.authorization;
            }
          }
          if (opts.body && typeof opts.body !== "string") {
            throw new Error("Request body must be a string");
          }
          const search = url2.includes("?") ? url2.slice(url2.indexOf("?") + 1) : "";
          const rendered = await respond({
            host: request.host,
            method: opts.method || "GET",
            headers,
            path: relative,
            rawBody: opts.body == null ? null : new TextEncoder().encode(opts.body),
            query: new URLSearchParams(search)
          }, options2, {
            fetched: url2,
            initiator: route
          });
          if (rendered) {
            if (state.prerender) {
              state.prerender.dependencies.set(relative, rendered);
            }
            response = new Response(rendered.body, {
              status: rendered.status,
              headers: rendered.headers
            });
          }
        } else {
          if (resolved.startsWith("//")) {
            throw new Error(`Cannot request protocol-relative URL (${url2}) in server-side fetch`);
          }
          if (typeof request.host !== "undefined") {
            const { hostname: fetch_hostname } = new URL(url2);
            const [server_hostname] = request.host.split(":");
            if (`.${fetch_hostname}`.endsWith(`.${server_hostname}`) && opts.credentials !== "omit") {
              uses_credentials = true;
              opts.headers = {
                ...opts.headers,
                cookie: request.headers.cookie
              };
            }
          }
          const external_request = new Request(url2, opts);
          response = await options2.hooks.externalFetch.call(null, external_request);
        }
        if (response) {
          const proxy = new Proxy(response, {
            get(response2, key, _receiver) {
              async function text2() {
                const body = await response2.text();
                const headers = {};
                for (const [key2, value] of response2.headers) {
                  if (key2 === "set-cookie") {
                    set_cookie_headers = set_cookie_headers.concat(value);
                  } else if (key2 !== "etag") {
                    headers[key2] = value;
                  }
                }
                if (!opts.body || typeof opts.body === "string") {
                  fetched.push({
                    url: url2,
                    body: opts.body,
                    json: `{"status":${response2.status},"statusText":${s(response2.statusText)},"headers":${s(headers)},"body":"${escape_json_string_in_html(body)}"}`
                  });
                }
                return body;
              }
              if (key === "text") {
                return text2;
              }
              if (key === "json") {
                return async () => {
                  return JSON.parse(await text2());
                };
              }
              return Reflect.get(response2, key, response2);
            }
          });
          return proxy;
        }
        return response || new Response("Not found", {
          status: 404
        });
      },
      stuff: { ...stuff }
    };
    if (is_error) {
      load_input.status = status;
      load_input.error = error2;
    }
    loaded = await module2.load.call(null, load_input);
  } else {
    loaded = {};
  }
  if (!loaded && is_leaf && !is_error)
    return;
  if (!loaded) {
    throw new Error(`${node.entry} - load must return a value except for page fall through`);
  }
  return {
    node,
    loaded: normalize(loaded),
    stuff: loaded.stuff || stuff,
    fetched,
    set_cookie_headers,
    uses_credentials
  };
}
function resolve(base2, path) {
  const base_match = absolute.exec(base2);
  const path_match = absolute.exec(path);
  if (!base_match) {
    throw new Error(`bad base path: "${base2}"`);
  }
  const baseparts = path_match ? [] : base2.slice(base_match[0].length).split("/");
  const pathparts = path_match ? path.slice(path_match[0].length).split("/") : path.split("/");
  baseparts.pop();
  for (let i = 0; i < pathparts.length; i += 1) {
    const part = pathparts[i];
    if (part === ".")
      continue;
    else if (part === "..")
      baseparts.pop();
    else
      baseparts.push(part);
  }
  const prefix = path_match && path_match[0] || base_match && base_match[0] || "";
  return `${prefix}${baseparts.join("/")}`;
}
async function respond_with_error({ request, options: options2, state, $session, status, error: error2 }) {
  const default_layout = await options2.load_component(options2.manifest.layout);
  const default_error = await options2.load_component(options2.manifest.error);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params: {}
  };
  const loaded = await load_node({
    request,
    options: options2,
    state,
    route: null,
    page,
    node: default_layout,
    $session,
    stuff: {},
    prerender_enabled: is_prerender_enabled(options2, default_error, state),
    is_leaf: false,
    is_error: false
  });
  const branch = [
    loaded,
    await load_node({
      request,
      options: options2,
      state,
      route: null,
      page,
      node: default_error,
      $session,
      stuff: loaded ? loaded.stuff : {},
      prerender_enabled: is_prerender_enabled(options2, default_error, state),
      is_leaf: false,
      is_error: true,
      status,
      error: error2
    })
  ];
  try {
    return await render_response({
      options: options2,
      $session,
      page_config: {
        hydrate: options2.hydrate,
        router: options2.router,
        ssr: options2.ssr
      },
      status,
      error: error2,
      branch,
      page
    });
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return {
      status: 500,
      headers: {},
      body: error3.stack
    };
  }
}
function is_prerender_enabled(options2, node, state) {
  return options2.prerender && (!!node.module.prerender || !!state.prerender && state.prerender.all);
}
async function respond$1(opts) {
  const { request, options: options2, state, $session, route } = opts;
  let nodes;
  try {
    nodes = await Promise.all(route.a.map((id) => id ? options2.load_component(id) : void 0));
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return await respond_with_error({
      request,
      options: options2,
      state,
      $session,
      status: 500,
      error: error3
    });
  }
  const leaf = nodes[nodes.length - 1].module;
  let page_config = get_page_config(leaf, options2);
  if (!leaf.prerender && state.prerender && !state.prerender.all) {
    return {
      status: 204,
      headers: {}
    };
  }
  let branch = [];
  let status = 200;
  let error2;
  let set_cookie_headers = [];
  ssr:
    if (page_config.ssr) {
      let stuff = {};
      for (let i = 0; i < nodes.length; i += 1) {
        const node = nodes[i];
        let loaded;
        if (node) {
          try {
            loaded = await load_node({
              ...opts,
              node,
              stuff,
              prerender_enabled: is_prerender_enabled(options2, node, state),
              is_leaf: i === nodes.length - 1,
              is_error: false
            });
            if (!loaded)
              return;
            set_cookie_headers = set_cookie_headers.concat(loaded.set_cookie_headers);
            if (loaded.loaded.redirect) {
              return with_cookies({
                status: loaded.loaded.status,
                headers: {
                  location: encodeURI(loaded.loaded.redirect)
                }
              }, set_cookie_headers);
            }
            if (loaded.loaded.error) {
              ({ status, error: error2 } = loaded.loaded);
            }
          } catch (err) {
            const e = coalesce_to_error(err);
            options2.handle_error(e, request);
            status = 500;
            error2 = e;
          }
          if (loaded && !error2) {
            branch.push(loaded);
          }
          if (error2) {
            while (i--) {
              if (route.b[i]) {
                const error_node = await options2.load_component(route.b[i]);
                let node_loaded;
                let j = i;
                while (!(node_loaded = branch[j])) {
                  j -= 1;
                }
                try {
                  const error_loaded = await load_node({
                    ...opts,
                    node: error_node,
                    stuff: node_loaded.stuff,
                    prerender_enabled: is_prerender_enabled(options2, error_node, state),
                    is_leaf: false,
                    is_error: true,
                    status,
                    error: error2
                  });
                  if (error_loaded.loaded.error) {
                    continue;
                  }
                  page_config = get_page_config(error_node.module, options2);
                  branch = branch.slice(0, j + 1).concat(error_loaded);
                  break ssr;
                } catch (err) {
                  const e = coalesce_to_error(err);
                  options2.handle_error(e, request);
                  continue;
                }
              }
            }
            return with_cookies(await respond_with_error({
              request,
              options: options2,
              state,
              $session,
              status,
              error: error2
            }), set_cookie_headers);
          }
        }
        if (loaded && loaded.loaded.stuff) {
          stuff = {
            ...stuff,
            ...loaded.loaded.stuff
          };
        }
      }
    }
  try {
    return with_cookies(await render_response({
      ...opts,
      page_config,
      status,
      error: error2,
      branch: branch.filter(Boolean)
    }), set_cookie_headers);
  } catch (err) {
    const error3 = coalesce_to_error(err);
    options2.handle_error(error3, request);
    return with_cookies(await respond_with_error({
      ...opts,
      status: 500,
      error: error3
    }), set_cookie_headers);
  }
}
function get_page_config(leaf, options2) {
  return {
    ssr: "ssr" in leaf ? !!leaf.ssr : options2.ssr,
    router: "router" in leaf ? !!leaf.router : options2.router,
    hydrate: "hydrate" in leaf ? !!leaf.hydrate : options2.hydrate
  };
}
function with_cookies(response, set_cookie_headers) {
  if (set_cookie_headers.length) {
    response.headers["set-cookie"] = set_cookie_headers;
  }
  return response;
}
async function render_page(request, route, match, options2, state) {
  if (state.initiator === route) {
    return {
      status: 404,
      headers: {},
      body: `Not found: ${request.path}`
    };
  }
  const params = route.params(match);
  const page = {
    host: request.host,
    path: request.path,
    query: request.query,
    params
  };
  const $session = await options2.hooks.getSession(request);
  const response = await respond$1({
    request,
    options: options2,
    state,
    $session,
    route,
    page
  });
  if (response) {
    return response;
  }
  if (state.fetched) {
    return {
      status: 500,
      headers: {},
      body: `Bad request in load function: failed to fetch ${state.fetched}`
    };
  }
}
function read_only_form_data() {
  const map = new Map();
  return {
    append(key, value) {
      if (map.has(key)) {
        (map.get(key) || []).push(value);
      } else {
        map.set(key, [value]);
      }
    },
    data: new ReadOnlyFormData(map)
  };
}
function parse_body(raw, headers) {
  if (!raw)
    return raw;
  const content_type = headers["content-type"];
  const [type, ...directives] = content_type ? content_type.split(/;\s*/) : [];
  const text2 = () => new TextDecoder(headers["content-encoding"] || "utf-8").decode(raw);
  switch (type) {
    case "text/plain":
      return text2();
    case "application/json":
      return JSON.parse(text2());
    case "application/x-www-form-urlencoded":
      return get_urlencoded(text2());
    case "multipart/form-data": {
      const boundary = directives.find((directive) => directive.startsWith("boundary="));
      if (!boundary)
        throw new Error("Missing boundary");
      return get_multipart(text2(), boundary.slice("boundary=".length));
    }
    default:
      return raw;
  }
}
function get_urlencoded(text2) {
  const { data, append: append2 } = read_only_form_data();
  text2.replace(/\+/g, " ").split("&").forEach((str) => {
    const [key, value] = str.split("=");
    append2(decodeURIComponent(key), decodeURIComponent(value));
  });
  return data;
}
function get_multipart(text2, boundary) {
  const parts = text2.split(`--${boundary}`);
  if (parts[0] !== "" || parts[parts.length - 1].trim() !== "--") {
    throw new Error("Malformed form data");
  }
  const { data, append: append2 } = read_only_form_data();
  parts.slice(1, -1).forEach((part) => {
    const match = /\s*([\s\S]+?)\r\n\r\n([\s\S]*)\s*/.exec(part);
    if (!match) {
      throw new Error("Malformed form data");
    }
    const raw_headers = match[1];
    const body = match[2].trim();
    let key;
    const headers = {};
    raw_headers.split("\r\n").forEach((str) => {
      const [raw_header, ...raw_directives] = str.split("; ");
      let [name, value] = raw_header.split(": ");
      name = name.toLowerCase();
      headers[name] = value;
      const directives = {};
      raw_directives.forEach((raw_directive) => {
        const [name2, value2] = raw_directive.split("=");
        directives[name2] = JSON.parse(value2);
      });
      if (name === "content-disposition") {
        if (value !== "form-data")
          throw new Error("Malformed form data");
        if (directives.filename) {
          throw new Error("File upload is not yet implemented");
        }
        if (directives.name) {
          key = directives.name;
        }
      }
    });
    if (!key)
      throw new Error("Malformed form data");
    append2(key, body);
  });
  return data;
}
async function respond(incoming, options2, state = {}) {
  if (incoming.path !== "/" && options2.trailing_slash !== "ignore") {
    const has_trailing_slash = incoming.path.endsWith("/");
    if (has_trailing_slash && options2.trailing_slash === "never" || !has_trailing_slash && options2.trailing_slash === "always" && !(incoming.path.split("/").pop() || "").includes(".")) {
      const path = has_trailing_slash ? incoming.path.slice(0, -1) : incoming.path + "/";
      const q = incoming.query.toString();
      return {
        status: 301,
        headers: {
          location: options2.paths.base + path + (q ? `?${q}` : "")
        }
      };
    }
  }
  const headers = lowercase_keys(incoming.headers);
  const request = {
    ...incoming,
    headers,
    body: parse_body(incoming.rawBody, headers),
    params: {},
    locals: {}
  };
  try {
    return await options2.hooks.handle({
      request,
      resolve: async (request2) => {
        if (state.prerender && state.prerender.fallback) {
          return await render_response({
            options: options2,
            $session: await options2.hooks.getSession(request2),
            page_config: { ssr: false, router: true, hydrate: true },
            status: 200,
            branch: []
          });
        }
        const decoded = decodeURI(request2.path);
        for (const route of options2.manifest.routes) {
          const match = route.pattern.exec(decoded);
          if (!match)
            continue;
          const response = route.type === "endpoint" ? await render_endpoint(request2, route, match) : await render_page(request2, route, match, options2, state);
          if (response) {
            if (response.status === 200) {
              const cache_control = get_single_valued_header(response.headers, "cache-control");
              if (!cache_control || !/(no-store|immutable)/.test(cache_control)) {
                const etag = `"${hash(response.body || "")}"`;
                if (request2.headers["if-none-match"] === etag) {
                  return {
                    status: 304,
                    headers: {}
                  };
                }
                response.headers["etag"] = etag;
              }
            }
            return response;
          }
        }
        const $session = await options2.hooks.getSession(request2);
        return await respond_with_error({
          request: request2,
          options: options2,
          state,
          $session,
          status: 404,
          error: new Error(`Not found: ${request2.path}`)
        });
      }
    });
  } catch (err) {
    const e = coalesce_to_error(err);
    options2.handle_error(e, request);
    return {
      status: 500,
      headers: {},
      body: options2.dev ? e.stack : e.message
    };
  }
}
function noop() {
}
function assign(tar, src2) {
  for (const k in src2)
    tar[k] = src2[k];
  return tar;
}
function run(fn) {
  return fn();
}
function blank_object() {
  return Object.create(null);
}
function run_all(fns) {
  fns.forEach(run);
}
function is_function(thing) {
  return typeof thing === "function";
}
function safe_not_equal(a, b) {
  return a != a ? b == b : a !== b || (a && typeof a === "object" || typeof a === "function");
}
function subscribe(store, ...callbacks) {
  if (store == null) {
    return noop;
  }
  const unsub = store.subscribe(...callbacks);
  return unsub.unsubscribe ? () => unsub.unsubscribe() : unsub;
}
function compute_rest_props(props, keys) {
  const rest = {};
  keys = new Set(keys);
  for (const k in props)
    if (!keys.has(k) && k[0] !== "$")
      rest[k] = props[k];
  return rest;
}
function set_store_value(store, ret, value) {
  store.set(value);
  return ret;
}
function run_tasks(now22) {
  tasks.forEach((task) => {
    if (!task.c(now22)) {
      tasks.delete(task);
      task.f();
    }
  });
  if (tasks.size !== 0)
    raf(run_tasks);
}
function loop2(callback) {
  let task;
  if (tasks.size === 0)
    raf(run_tasks);
  return {
    promise: new Promise((fulfill) => {
      tasks.add(task = { c: callback, f: fulfill });
    }),
    abort() {
      tasks.delete(task);
    }
  };
}
function custom_event(type, detail, bubbles = false) {
  const e = document.createEvent("CustomEvent");
  e.initCustomEvent(type, bubbles, false, detail);
  return e;
}
function set_current_component(component) {
  current_component = component;
}
function get_current_component() {
  if (!current_component)
    throw new Error("Function called outside component initialization");
  return current_component;
}
function onDestroy(fn) {
  get_current_component().$$.on_destroy.push(fn);
}
function createEventDispatcher() {
  const component = get_current_component();
  return (type, detail) => {
    const callbacks = component.$$.callbacks[type];
    if (callbacks) {
      const event = custom_event(type, detail);
      callbacks.slice().forEach((fn) => {
        fn.call(component, event);
      });
    }
  };
}
function setContext(key, context) {
  get_current_component().$$.context.set(key, context);
}
function schedule_update() {
  if (!update_scheduled) {
    update_scheduled = true;
    resolved_promise.then(flush);
  }
}
function tick() {
  schedule_update();
  return resolved_promise;
}
function add_render_callback(fn) {
  render_callbacks.push(fn);
}
function flush() {
  if (flushing)
    return;
  flushing = true;
  do {
    for (let i = 0; i < dirty_components.length; i += 1) {
      const component = dirty_components[i];
      set_current_component(component);
      update2(component.$$);
    }
    set_current_component(null);
    dirty_components.length = 0;
    while (binding_callbacks.length)
      binding_callbacks.pop()();
    for (let i = 0; i < render_callbacks.length; i += 1) {
      const callback = render_callbacks[i];
      if (!seen_callbacks.has(callback)) {
        seen_callbacks.add(callback);
        callback();
      }
    }
    render_callbacks.length = 0;
  } while (dirty_components.length);
  while (flush_callbacks.length) {
    flush_callbacks.pop()();
  }
  update_scheduled = false;
  flushing = false;
  seen_callbacks.clear();
}
function update2($$) {
  if ($$.fragment !== null) {
    $$.update();
    run_all($$.before_update);
    const dirty = $$.dirty;
    $$.dirty = [-1];
    $$.fragment && $$.fragment.p($$.ctx, dirty);
    $$.after_update.forEach(add_render_callback);
  }
}
function spread(args, classes_to_add) {
  const attributes = Object.assign({}, ...args);
  if (classes_to_add) {
    if (attributes.class == null) {
      attributes.class = classes_to_add;
    } else {
      attributes.class += " " + classes_to_add;
    }
  }
  let str = "";
  Object.keys(attributes).forEach((name) => {
    if (invalid_attribute_name_character.test(name))
      return;
    const value = attributes[name];
    if (value === true)
      str += " " + name;
    else if (boolean_attributes.has(name.toLowerCase())) {
      if (value)
        str += " " + name;
    } else if (value != null) {
      str += ` ${name}="${value}"`;
    }
  });
  return str;
}
function escape(html2) {
  return String(html2).replace(/["'&<>]/g, (match) => escaped[match]);
}
function escape_attribute_value(value) {
  return typeof value === "string" ? escape(value) : value;
}
function escape_object(obj) {
  const result = {};
  for (const key in obj) {
    result[key] = escape_attribute_value(obj[key]);
  }
  return result;
}
function each2(items, fn) {
  let str = "";
  for (let i = 0; i < items.length; i += 1) {
    str += fn(items[i], i);
  }
  return str;
}
function validate_component(component, name) {
  if (!component || !component.$$render) {
    if (name === "svelte:component")
      name += " this={...}";
    throw new Error(`<${name}> is not a valid SSR component. You may need to review your build config to ensure that dependencies are compiled, rather than imported as pre-compiled modules`);
  }
  return component;
}
function create_ssr_component(fn) {
  function $$render(result, props, bindings, slots, context) {
    const parent_component = current_component;
    const $$ = {
      on_destroy,
      context: new Map(context || (parent_component ? parent_component.$$.context : [])),
      on_mount: [],
      before_update: [],
      after_update: [],
      callbacks: blank_object()
    };
    set_current_component({ $$ });
    const html2 = fn(result, props, bindings, slots);
    set_current_component(parent_component);
    return html2;
  }
  return {
    render: (props = {}, { $$slots = {}, context = new Map() } = {}) => {
      on_destroy = [];
      const result = { title: "", head: "", css: new Set() };
      const html2 = $$render(result, props, {}, $$slots, context);
      run_all(on_destroy);
      return {
        html: html2,
        css: {
          code: Array.from(result.css).map((css22) => css22.code).join("\n"),
          map: null
        },
        head: result.title + result.head
      };
    },
    $$render
  };
}
function add_attribute(name, value, boolean) {
  if (value == null || boolean && !value)
    return "";
  return ` ${name}${value === true ? "" : `=${typeof value === "string" ? JSON.stringify(escape(value)) : `"${value}"`}`}`;
}
function afterUpdate() {
}
function set_paths(paths) {
  base = paths.base;
  assets = paths.assets || base;
}
function set_prerendering(value) {
}
function init(settings = default_settings) {
  set_paths(settings.paths);
  set_prerendering(settings.prerendering || false);
  const hooks = get_hooks(user_hooks);
  options = {
    amp: false,
    dev: false,
    entry: {
      file: assets + "/_app/start-4e888e29.js",
      css: [assets + "/_app/assets/start-61d1577b.css"],
      js: [assets + "/_app/start-4e888e29.js", assets + "/_app/chunks/vendor-c59da0d5.js"]
    },
    fetched: void 0,
    floc: false,
    get_component_path: (id) => assets + "/_app/" + entry_lookup[id],
    get_stack: (error2) => String(error2),
    handle_error: (error2, request) => {
      hooks.handleError({ error: error2, request });
      error2.stack = options.get_stack(error2);
    },
    hooks,
    hydrate: true,
    initiator: void 0,
    load_component,
    manifest,
    paths: settings.paths,
    prerender: true,
    read: settings.read,
    root: Root,
    service_worker: null,
    router: true,
    ssr: true,
    target: "#svelte",
    template,
    trailing_slash: "never"
  };
}
async function load_component(file) {
  const { entry, css: css22, js, styles: styles2 } = metadata_lookup[file];
  return {
    module: await module_lookup[file](),
    entry: assets + "/_app/" + entry,
    css: css22.map((dep) => assets + "/_app/" + dep),
    js: js.map((dep) => assets + "/_app/" + dep),
    styles: styles2
  };
}
function render(request, {
  prerender
} = {}) {
  const host = request.headers["host"];
  return respond({ ...request, host }, options, { prerender });
}
var __accessCheck, __privateGet, __privateAdd, __privateSet, _map, chars, unsafeChars, reserved, escaped$1, objectProtoOwnPropertyNames, subscriber_queue2, escape_json_string_in_html_dict, escape_html_attr_dict, s$1, s, absolute, ReadOnlyFormData, identity, is_client, now2, raf, tasks, current_component, dirty_components, binding_callbacks, render_callbacks, flush_callbacks, resolved_promise, update_scheduled, flushing, seen_callbacks, boolean_attributes, invalid_attribute_name_character, escaped, missing_component, on_destroy, css6, Root, base, assets, user_hooks, template, options, default_settings, empty, manifest, get_hooks, module_lookup, metadata_lookup;
var init_app_171d3477 = __esm({
  ".svelte-kit/output/server/chunks/app-171d3477.js"() {
    init_shims();
    __accessCheck = (obj, member, msg) => {
      if (!member.has(obj))
        throw TypeError("Cannot " + msg);
    };
    __privateGet = (obj, member, getter) => {
      __accessCheck(obj, member, "read from private field");
      return getter ? getter.call(obj) : member.get(obj);
    };
    __privateAdd = (obj, member, value) => {
      if (member.has(obj))
        throw TypeError("Cannot add the same private member more than once");
      member instanceof WeakSet ? member.add(obj) : member.set(obj, value);
    };
    __privateSet = (obj, member, value, setter) => {
      __accessCheck(obj, member, "write to private field");
      setter ? setter.call(obj, value) : member.set(obj, value);
      return value;
    };
    chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_$";
    unsafeChars = /[<>\b\f\n\r\t\0\u2028\u2029]/g;
    reserved = /^(?:do|if|in|for|int|let|new|try|var|byte|case|char|else|enum|goto|long|this|void|with|await|break|catch|class|const|final|float|short|super|throw|while|yield|delete|double|export|import|native|return|switch|throws|typeof|boolean|default|extends|finally|package|private|abstract|continue|debugger|function|volatile|interface|protected|transient|implements|instanceof|synchronized)$/;
    escaped$1 = {
      "<": "\\u003C",
      ">": "\\u003E",
      "/": "\\u002F",
      "\\": "\\\\",
      "\b": "\\b",
      "\f": "\\f",
      "\n": "\\n",
      "\r": "\\r",
      "	": "\\t",
      "\0": "\\0",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029"
    };
    objectProtoOwnPropertyNames = Object.getOwnPropertyNames(Object.prototype).sort().join("\0");
    Promise.resolve();
    subscriber_queue2 = [];
    escape_json_string_in_html_dict = {
      '"': '\\"',
      "<": "\\u003C",
      ">": "\\u003E",
      "/": "\\u002F",
      "\\": "\\\\",
      "\b": "\\b",
      "\f": "\\f",
      "\n": "\\n",
      "\r": "\\r",
      "	": "\\t",
      "\0": "\\0",
      "\u2028": "\\u2028",
      "\u2029": "\\u2029"
    };
    escape_html_attr_dict = {
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;"
    };
    s$1 = JSON.stringify;
    s = JSON.stringify;
    absolute = /^([a-z]+:)?\/?\//;
    ReadOnlyFormData = class {
      constructor(map) {
        __privateAdd(this, _map, void 0);
        __privateSet(this, _map, map);
      }
      get(key) {
        const value = __privateGet(this, _map).get(key);
        return value && value[0];
      }
      getAll(key) {
        return __privateGet(this, _map).get(key);
      }
      has(key) {
        return __privateGet(this, _map).has(key);
      }
      *[Symbol.iterator]() {
        for (const [key, value] of __privateGet(this, _map)) {
          for (let i = 0; i < value.length; i += 1) {
            yield [key, value[i]];
          }
        }
      }
      *entries() {
        for (const [key, value] of __privateGet(this, _map)) {
          for (let i = 0; i < value.length; i += 1) {
            yield [key, value[i]];
          }
        }
      }
      *keys() {
        for (const [key] of __privateGet(this, _map))
          yield key;
      }
      *values() {
        for (const [, value] of __privateGet(this, _map)) {
          for (let i = 0; i < value.length; i += 1) {
            yield value[i];
          }
        }
      }
    };
    _map = new WeakMap();
    identity = (x) => x;
    is_client = typeof window !== "undefined";
    now2 = is_client ? () => window.performance.now() : () => Date.now();
    raf = is_client ? (cb) => requestAnimationFrame(cb) : noop;
    tasks = new Set();
    dirty_components = [];
    binding_callbacks = [];
    render_callbacks = [];
    flush_callbacks = [];
    resolved_promise = Promise.resolve();
    update_scheduled = false;
    flushing = false;
    seen_callbacks = new Set();
    boolean_attributes = new Set([
      "allowfullscreen",
      "allowpaymentrequest",
      "async",
      "autofocus",
      "autoplay",
      "checked",
      "controls",
      "default",
      "defer",
      "disabled",
      "formnovalidate",
      "hidden",
      "ismap",
      "loop",
      "multiple",
      "muted",
      "nomodule",
      "novalidate",
      "open",
      "playsinline",
      "readonly",
      "required",
      "reversed",
      "selected"
    ]);
    invalid_attribute_name_character = /[\s'">/=\u{FDD0}-\u{FDEF}\u{FFFE}\u{FFFF}\u{1FFFE}\u{1FFFF}\u{2FFFE}\u{2FFFF}\u{3FFFE}\u{3FFFF}\u{4FFFE}\u{4FFFF}\u{5FFFE}\u{5FFFF}\u{6FFFE}\u{6FFFF}\u{7FFFE}\u{7FFFF}\u{8FFFE}\u{8FFFF}\u{9FFFE}\u{9FFFF}\u{AFFFE}\u{AFFFF}\u{BFFFE}\u{BFFFF}\u{CFFFE}\u{CFFFF}\u{DFFFE}\u{DFFFF}\u{EFFFE}\u{EFFFF}\u{FFFFE}\u{FFFFF}\u{10FFFE}\u{10FFFF}]/u;
    escaped = {
      '"': "&quot;",
      "'": "&#39;",
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;"
    };
    missing_component = {
      $$render: () => ""
    };
    css6 = {
      code: "#svelte-announcer.svelte-1j55zn5{position:absolute;left:0;top:0;clip:rect(0 0 0 0);clip-path:inset(50%);overflow:hidden;white-space:nowrap;width:1px;height:1px}",
      map: null
    };
    Root = create_ssr_component(($$result, $$props, $$bindings, slots) => {
      let { stores } = $$props;
      let { page } = $$props;
      let { components } = $$props;
      let { props_0 = null } = $$props;
      let { props_1 = null } = $$props;
      let { props_2 = null } = $$props;
      setContext("__svelte__", stores);
      afterUpdate(stores.page.notify);
      if ($$props.stores === void 0 && $$bindings.stores && stores !== void 0)
        $$bindings.stores(stores);
      if ($$props.page === void 0 && $$bindings.page && page !== void 0)
        $$bindings.page(page);
      if ($$props.components === void 0 && $$bindings.components && components !== void 0)
        $$bindings.components(components);
      if ($$props.props_0 === void 0 && $$bindings.props_0 && props_0 !== void 0)
        $$bindings.props_0(props_0);
      if ($$props.props_1 === void 0 && $$bindings.props_1 && props_1 !== void 0)
        $$bindings.props_1(props_1);
      if ($$props.props_2 === void 0 && $$bindings.props_2 && props_2 !== void 0)
        $$bindings.props_2(props_2);
      $$result.css.add(css6);
      {
        stores.page.set(page);
      }
      return `


${validate_component(components[0] || missing_component, "svelte:component").$$render($$result, Object.assign(props_0 || {}), {}, {
        default: () => `${components[1] ? `${validate_component(components[1] || missing_component, "svelte:component").$$render($$result, Object.assign(props_1 || {}), {}, {
          default: () => `${components[2] ? `${validate_component(components[2] || missing_component, "svelte:component").$$render($$result, Object.assign(props_2 || {}), {}, {})}` : ``}`
        })}` : ``}`
      })}

${``}`;
    });
    base = "";
    assets = "";
    user_hooks = /* @__PURE__ */ Object.freeze({
      __proto__: null,
      [Symbol.toStringTag]: "Module"
    });
    template = ({ head, body }) => '<!DOCTYPE html>\n<html lang="en">\n	<head>\n		<title>Noava DeFi</title>\n		<meta charset="utf-8" />\n		<link rel="icon" href="/favicon.png" />\n		<meta name="viewport" content="width=device-width, initial-scale=1" />\n		<script src="https://cdn.jsdelivr.net/npm/web3@latest/dist/web3.min.js"><\/script>\n		<style type="text/css">iframe#_hjRemoteVarsFrame {display: none !important; width: 1px !important; height: 1px !important; opacity: 0 !important; pointer-events: none !important;}</style>\n		<link rel="stylesheet" href="https://stackpath.bootstrapcdn.com/bootstrap/4.3.1/css/bootstrap.min.css" integrity="sha384-ggOyR0iXCbMQv3Xipma34MD+dH/1fQ784/j6cY/iJTQUOhcWr7x9JvoRxT2MZw1T" crossorigin="anonymous">\n	 \n		' + head + '\n	</head>\n	<body>\n		<div id="svelte">' + body + "</div>\n	</body>\n</html>\n";
    options = null;
    default_settings = { paths: { "base": "", "assets": "" } };
    empty = () => ({});
    manifest = {
      assets: [{ "file": ".DS_Store", "size": 8196, "type": null }, { "file": "3.webp", "size": 186540, "type": "image/webp" }, { "file": "BANANA.svg", "size": 4027, "type": "image/svg+xml" }, { "file": "BUSD-USDT.svg", "size": 1671, "type": "image/svg+xml" }, { "file": "CAKE-BUSD.svg", "size": 10122, "type": "image/svg+xml" }, { "file": "CAKE.svg", "size": 9448, "type": "image/svg+xml" }, { "file": "Montserrat-Bold.079ca05d.ttf", "size": 244468, "type": "font/ttf" }, { "file": "Montserrat-Regular.3cd78665.ttf", "size": 245708, "type": "font/ttf" }, { "file": "Montserrat-SemiBold.fa8441f3.ttf", "size": 243816, "type": "font/ttf" }, { "file": "RedHatDisplay-Bold.c7f567b8.ttf", "size": 76476, "type": "font/ttf" }, { "file": "RedHatDisplay-Medium.55973a9d.ttf", "size": 75472, "type": "font/ttf" }, { "file": "RedHatDisplay-Regular.e7897cb2.ttf", "size": 74912, "type": "font/ttf" }, { "file": "YSL-BUSD.svg", "size": 3515, "type": "image/svg+xml" }, { "file": "all_active_vault.f48f66de.svg", "size": 1067, "type": "image/svg+xml" }, { "file": "css.css", "size": 61194, "type": "text/css" }, { "file": "css1.css", "size": 330976, "type": "text/css" }, { "file": "css2.css", "size": 94470, "type": "text/css" }, { "file": "css3.css", "size": 1839676, "type": "text/css" }, { "file": "favicon.png", "size": 26596, "type": "image/png" }, { "file": "fun.js", "size": 2101, "type": "application/javascript" }, { "file": "icons.a445f525.ttf", "size": 5600, "type": "font/ttf" }, { "file": "logo.png", "size": 58563, "type": "image/png" }, { "file": "logo2.png", "size": 53079, "type": "image/png" }, { "file": "metamask.53ea9825.svg", "size": 21684, "type": "image/svg+xml" }, { "file": "sYSL-BUSD.svg", "size": 3517, "type": "image/svg+xml" }, { "file": "sYSL.svg", "size": 3011, "type": "image/svg+xml" }],
      layout: ".svelte-kit/build/components/layout.svelte",
      error: ".svelte-kit/build/components/error.svelte",
      routes: [
        {
          type: "page",
          pattern: /^\/$/,
          params: empty,
          a: [".svelte-kit/build/components/layout.svelte", "src/routes/index.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/stakingTab\/?$/,
          params: empty,
          a: [".svelte-kit/build/components/layout.svelte", "src/routes/stakingTab.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/bridgetab\/?$/,
          params: empty,
          a: [".svelte-kit/build/components/layout.svelte", "src/routes/bridgetab.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/launchTab\/?$/,
          params: empty,
          a: [".svelte-kit/build/components/layout.svelte", "src/routes/launchTab.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/launchpad\/?$/,
          params: empty,
          a: [".svelte-kit/build/components/layout.svelte", "src/routes/launchpad.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/lottery\/?$/,
          params: empty,
          a: [".svelte-kit/build/components/layout.svelte", "src/routes/lottery.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/banner\/?$/,
          params: empty,
          a: [".svelte-kit/build/components/layout.svelte", "src/routes/banner.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/bridge\/?$/,
          params: empty,
          a: [".svelte-kit/build/components/layout.svelte", "src/routes/bridge.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/home\/?$/,
          params: empty,
          a: [".svelte-kit/build/components/layout.svelte", "src/routes/home.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/menu\/?$/,
          params: empty,
          a: [".svelte-kit/build/components/layout.svelte", "src/routes/menu.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/tabs\/?$/,
          params: empty,
          a: [".svelte-kit/build/components/layout.svelte", "src/routes/tabs.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "page",
          pattern: /^\/tvl\/?$/,
          params: empty,
          a: [".svelte-kit/build/components/layout.svelte", "src/routes/tvl.svelte"],
          b: [".svelte-kit/build/components/error.svelte"]
        },
        {
          type: "endpoint",
          pattern: /^\/url\/?$/,
          params: empty,
          load: () => Promise.resolve().then(() => (init_url_9b321f75(), url_9b321f75_exports))
        }
      ]
    };
    get_hooks = (hooks) => ({
      getSession: hooks.getSession || (() => ({})),
      handle: hooks.handle || (({ request, resolve: resolve2 }) => resolve2(request)),
      handleError: hooks.handleError || (({ error: error2 }) => console.error(error2.stack)),
      externalFetch: hooks.externalFetch || fetch
    });
    module_lookup = {
      ".svelte-kit/build/components/layout.svelte": () => Promise.resolve().then(() => (init_layout_133469ff(), layout_133469ff_exports)),
      ".svelte-kit/build/components/error.svelte": () => Promise.resolve().then(() => (init_error_2686f671(), error_2686f671_exports)),
      "src/routes/index.svelte": () => Promise.resolve().then(() => (init_index_f03303d8(), index_f03303d8_exports)),
      "src/routes/stakingTab.svelte": () => Promise.resolve().then(() => (init_stakingTab_c9c49832(), stakingTab_c9c49832_exports)),
      "src/routes/bridgetab.svelte": () => Promise.resolve().then(() => (init_bridgetab_51870fe2(), bridgetab_51870fe2_exports)),
      "src/routes/launchTab.svelte": () => Promise.resolve().then(() => (init_launchTab_52bf17b3(), launchTab_52bf17b3_exports)),
      "src/routes/launchpad.svelte": () => Promise.resolve().then(() => (init_launchpad_a893687d(), launchpad_a893687d_exports)),
      "src/routes/lottery.svelte": () => Promise.resolve().then(() => (init_lottery_9d0a3c39(), lottery_9d0a3c39_exports)),
      "src/routes/banner.svelte": () => Promise.resolve().then(() => (init_banner_f9439a17(), banner_f9439a17_exports)),
      "src/routes/bridge.svelte": () => Promise.resolve().then(() => (init_bridge_a2406c9e(), bridge_a2406c9e_exports)),
      "src/routes/home.svelte": () => Promise.resolve().then(() => (init_home_bc831c90(), home_bc831c90_exports)),
      "src/routes/menu.svelte": () => Promise.resolve().then(() => (init_menu_67c0da2d(), menu_67c0da2d_exports)),
      "src/routes/tabs.svelte": () => Promise.resolve().then(() => (init_tabs_3e2d466f(), tabs_3e2d466f_exports)),
      "src/routes/tvl.svelte": () => Promise.resolve().then(() => (init_tvl_b6726eb0(), tvl_b6726eb0_exports))
    };
    metadata_lookup = { ".svelte-kit/build/components/layout.svelte": { "entry": "layout.svelte-345c5405.js", "css": [], "js": ["layout.svelte-345c5405.js", "chunks/vendor-c59da0d5.js"], "styles": [] }, ".svelte-kit/build/components/error.svelte": { "entry": "error.svelte-0058a6ac.js", "css": [], "js": ["error.svelte-0058a6ac.js", "chunks/vendor-c59da0d5.js"], "styles": [] }, "src/routes/index.svelte": { "entry": "pages/index.svelte-5959aef5.js", "css": ["assets/lottery.svelte_svelte_type_style_lang-8e9a7d00.css", "assets/pages/bridgetab.svelte-7d0c83a6.css", "assets/pages/tvl.svelte-b035dc8d.css", "assets/pages/banner.svelte-65beb2c5.css", "assets/pages/launchTab.svelte-a17b1fc7.css"], "js": ["pages/index.svelte-5959aef5.js", "chunks/vendor-c59da0d5.js", "pages/bridge.svelte-05345ce5.js", "pages/bridgetab.svelte-1e926913.js", "pages/home.svelte-c5276b1d.js", "pages/tabs.svelte-6af3affb.js", "pages/stakingTab.svelte-41156bc8.js", "pages/tvl.svelte-6a8c4f4a.js", "pages/banner.svelte-ecd4a2cd.js", "pages/launchpad.svelte-2f661bf1.js", "pages/launchTab.svelte-b8c3a2ff.js", "chunks/menu-f5fc96d4.js"], "styles": [] }, "src/routes/stakingTab.svelte": { "entry": "pages/stakingTab.svelte-41156bc8.js", "css": [], "js": ["pages/stakingTab.svelte-41156bc8.js", "chunks/vendor-c59da0d5.js"], "styles": [] }, "src/routes/bridgetab.svelte": { "entry": "pages/bridgetab.svelte-1e926913.js", "css": ["assets/pages/bridgetab.svelte-7d0c83a6.css"], "js": ["pages/bridgetab.svelte-1e926913.js", "chunks/vendor-c59da0d5.js"], "styles": [] }, "src/routes/launchTab.svelte": { "entry": "pages/launchTab.svelte-b8c3a2ff.js", "css": ["assets/pages/launchTab.svelte-a17b1fc7.css"], "js": ["pages/launchTab.svelte-b8c3a2ff.js", "chunks/vendor-c59da0d5.js"], "styles": [] }, "src/routes/launchpad.svelte": { "entry": "pages/launchpad.svelte-2f661bf1.js", "css": ["assets/pages/launchTab.svelte-a17b1fc7.css"], "js": ["pages/launchpad.svelte-2f661bf1.js", "chunks/vendor-c59da0d5.js", "pages/launchTab.svelte-b8c3a2ff.js"], "styles": [] }, "src/routes/lottery.svelte": { "entry": "pages/lottery.svelte-816f04ce.js", "css": ["assets/lottery.svelte_svelte_type_style_lang-8e9a7d00.css"], "js": ["pages/lottery.svelte-816f04ce.js", "chunks/vendor-c59da0d5.js"], "styles": [] }, "src/routes/banner.svelte": { "entry": "pages/banner.svelte-ecd4a2cd.js", "css": ["assets/pages/banner.svelte-65beb2c5.css"], "js": ["pages/banner.svelte-ecd4a2cd.js", "chunks/vendor-c59da0d5.js"], "styles": [] }, "src/routes/bridge.svelte": { "entry": "pages/bridge.svelte-05345ce5.js", "css": ["assets/pages/bridgetab.svelte-7d0c83a6.css"], "js": ["pages/bridge.svelte-05345ce5.js", "chunks/vendor-c59da0d5.js", "pages/bridgetab.svelte-1e926913.js"], "styles": [] }, "src/routes/home.svelte": { "entry": "pages/home.svelte-c5276b1d.js", "css": ["assets/pages/tvl.svelte-b035dc8d.css", "assets/pages/banner.svelte-65beb2c5.css"], "js": ["pages/home.svelte-c5276b1d.js", "chunks/vendor-c59da0d5.js", "pages/tabs.svelte-6af3affb.js", "pages/stakingTab.svelte-41156bc8.js", "pages/tvl.svelte-6a8c4f4a.js", "pages/banner.svelte-ecd4a2cd.js"], "styles": [] }, "src/routes/menu.svelte": { "entry": "pages/menu.svelte-deda7f67.js", "css": [], "js": ["pages/menu.svelte-deda7f67.js", "chunks/vendor-c59da0d5.js", "chunks/menu-f5fc96d4.js"], "styles": [] }, "src/routes/tabs.svelte": { "entry": "pages/tabs.svelte-6af3affb.js", "css": [], "js": ["pages/tabs.svelte-6af3affb.js", "chunks/vendor-c59da0d5.js"], "styles": [] }, "src/routes/tvl.svelte": { "entry": "pages/tvl.svelte-6a8c4f4a.js", "css": ["assets/pages/tvl.svelte-b035dc8d.css"], "js": ["pages/tvl.svelte-6a8c4f4a.js", "chunks/vendor-c59da0d5.js"], "styles": [] } };
  }
});

// .svelte-kit/vercel/entry.js
__export(exports, {
  default: () => entry_default
});
init_shims();

// node_modules/@sveltejs/kit/dist/node.js
init_shims();
function getRawBody(req) {
  return new Promise((fulfil, reject) => {
    const h = req.headers;
    if (!h["content-type"]) {
      return fulfil(null);
    }
    req.on("error", reject);
    const length = Number(h["content-length"]);
    if (isNaN(length) && h["transfer-encoding"] == null) {
      return fulfil(null);
    }
    let data = new Uint8Array(length || 0);
    if (length > 0) {
      let offset2 = 0;
      req.on("data", (chunk) => {
        const new_len = offset2 + Buffer.byteLength(chunk);
        if (new_len > length) {
          return reject({
            status: 413,
            reason: 'Exceeded "Content-Length" limit'
          });
        }
        data.set(chunk, offset2);
        offset2 = new_len;
      });
    } else {
      req.on("data", (chunk) => {
        const new_data = new Uint8Array(data.length + chunk.length);
        new_data.set(data, 0);
        new_data.set(chunk, data.length);
        data = new_data;
      });
    }
    req.on("end", () => {
      fulfil(data);
    });
  });
}

// .svelte-kit/output/server/app.js
init_shims();
init_app_171d3477();

// .svelte-kit/vercel/entry.js
init();
var entry_default = async (req, res) => {
  const { pathname, searchParams } = new URL(req.url || "", "http://localhost");
  let body;
  try {
    body = await getRawBody(req);
  } catch (err) {
    res.statusCode = err.status || 400;
    return res.end(err.reason || "Invalid request body");
  }
  const rendered = await render({
    method: req.method,
    headers: req.headers,
    path: pathname,
    query: searchParams,
    rawBody: body
  });
  if (rendered) {
    const { status, headers, body: body2 } = rendered;
    return res.writeHead(status, headers).end(body2);
  }
  return res.writeHead(404).end();
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {});
/*! fetch-blob. MIT License. Jimmy Wärting <https://jimmy.warting.se/opensource> */

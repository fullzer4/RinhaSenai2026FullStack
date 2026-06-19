//#region src/core.d.ts
/** Prevents inference from a type position while supporting TypeScript 5.0. */
type NoInfer$2<T$1> = [T$1][T$1 extends unknown ? 0 : never];
/**
 * Unrecoverable error — user code threw inside Result operations.
 *
 * @example
 * Result.ok(1).map(() => { throw new Error("oops"); });  // Panic!
 */
declare class Panic extends Error {
  readonly _tag: "Panic";
  static is(value: unknown): value is Panic;
  constructor(args: {
    message: string;
    cause?: unknown;
  });
  toJSON(): object;
  /** Makes Panic yieldable in Result.gen blocks like other tagged errors. */
  [Symbol.iterator](): Generator<Err<never, this>, never, unknown>;
}
/** Type guard for Panic instances. */
declare const isPanic: (value: unknown) => value is Panic;
/** Throw an unrecoverable Panic. */
declare const panic: (message: string, cause?: unknown) => never;
type TapBothHandlers<A$1, E$1> = {
  ok: (a: A$1) => void;
  err: (e: E$1) => void;
};
type TapBothOkHandlers<A$1> = {
  ok: (a: A$1) => void;
  err: (e: never) => void;
};
type TapBothErrHandlers<E$1> = {
  ok: (a: never) => void;
  err: (e: E$1) => void;
};
type TapBothAsyncHandlers<A$1, E$1> = {
  ok: (a: A$1) => Promise<void>;
  err: (e: E$1) => Promise<void>;
};
type TapBothAsyncOkHandlers<A$1> = {
  ok: (a: A$1) => Promise<void>;
  err: (e: never) => Promise<void>;
};
type TapBothAsyncErrHandlers<E$1> = {
  ok: (a: never) => Promise<void>;
  err: (e: E$1) => Promise<void>;
};
/** Extracts the success type carried by either Result variant, including Err's phantom T. */
type InferSuccess<R> = R extends Ok<infer T, unknown> ? T : R extends Err<infer T, unknown> ? T : never;
/** Detects whether a type is a union. */
type IsUnion<T$1, U = T$1> = T$1 extends unknown ? ([U] extends [T$1] ? false : true) : never;
/** Return type for map that preserves concrete variants but prints public Result for Result unions. */
type MapReturn<R, B> = IsUnion<R> extends true ? Result$1<B, InferErr<R>> : R extends Ok<unknown, infer E> ? Ok<B, E> : R extends Err<unknown, infer E> ? Err<B, E> : never;
/** Return type for mapError that preserves concrete variants but prints public Result for Result unions. */
type MapErrorReturn<R, E2> = IsUnion<R> extends true ? Result$1<InferOk<R>, E2> : R extends Ok<infer A, unknown> ? Ok<A, E2> : R extends Err<infer T, unknown> ? Err<T, E2> : never;
/** Return type for recovery that preserves concrete variants but prints public Result for Result unions. */
type TryRecoverReturn<R, E2> = IsUnion<R> extends true ? Result$1<InferOk<R>, E2> : R extends Ok<infer A, unknown> ? Ok<A, E2> : R extends Err<infer T, unknown> ? Result$1<T, E2> : never;
/** Return type for andThen that preserves concrete variants but prints public Result for Result unions. */
type AndThenReturn<R, B, E2> = IsUnion<R> extends true ? Result$1<B, InferErr<R> | E2> : R extends Ok<unknown, infer E> ? Result$1<B, E | E2> : R extends Err<unknown, infer E> ? Err<B, E | E2> : never;
type TapBothHandlersFor<R> = {
  ok: (a: InferOk<R>) => void;
  err: (e: InferErr<R>) => void;
};
type TapBothAsyncHandlersFor<R> = {
  ok: (a: InferOk<R>) => Promise<void>;
  err: (e: InferErr<R>) => Promise<void>;
};
/**
 * Successful result variant.
 *
 * @template A Success value type.
 * @template E Error type (phantom - for type unification).
 *
 * @example
 * const result = new Ok(42);
 * result.value // 42
 * result.status // "ok"
 */
declare class Ok<A$1, E$1 = never> {
  readonly value: A$1;
  readonly status: "ok";
  constructor(value: A$1);
  /** Returns true, narrowing Result to Ok. */
  isOk(): this is Ok<A$1, E$1>;
  /** Returns false, narrowing Result to Err. */
  isErr(): this is Err<A$1, E$1>;
  /**
   * Transforms success value.
   *
   * @template B Transformed type.
   * @param fn Transformation function.
   * @returns Ok with transformed value.
   * @throws {Panic} If fn throws.
   *
   * @example
   * ok(2).map(x => x * 2) // Ok(4)
   */
  map<B>(this: Ok<A$1, E$1>, fn: (a: A$1) => B): Ok<B, E$1>;
  map<B, R extends AnyResult = Result$1<A$1, E$1>>(this: R, fn: (a: InferOk<R>) => B): MapReturn<R, B>;
  /**
   * No-op on Ok, returns self with new phantom error type.
   *
   * @template E2 New error type.
   * @param _fn Ignored.
   * @returns Self with updated phantom E type.
   */
  mapError<E2>(this: Ok<A$1, E$1>, _fn: (e: never) => E2): Ok<A$1, E2>;
  mapError<E2, R extends AnyResult = Result$1<A$1, E$1>>(this: R, _fn: (e: InferErr<R>) => E2): MapErrorReturn<R, E2>;
  /**
   * No-op on Ok, returns self with new phantom error type.
   *
   * @template E2 New error type.
   * @param _fn Ignored.
   * @returns Self with updated phantom E type.
   *
   * @example
   * ok(42).tryRecover(() => err("fallback")) // Ok(42)
   */
  tryRecover<E2>(this: Ok<A$1, E$1>, _fn: (e: never) => Result$1<NoInfer$2<A$1>, E2>): Ok<A$1, E2>;
  tryRecover<E2, R extends AnyResult = Result$1<A$1, E$1>>(this: R, _fn: (e: InferErr<R>) => Result$1<NoInfer$2<InferSuccess<R>>, E2>): TryRecoverReturn<R, E2>;
  /**
   * No-op on Ok, returns Promise of self with new phantom error type.
   *
   * @template E2 New error type.
   * @param _fn Ignored.
   * @returns Promise of self with updated phantom E type.
   *
   * @example
   * await ok(42).tryRecoverAsync(async () => err("fallback")) // Ok(42)
   */
  tryRecoverAsync<E2>(this: Ok<A$1, E$1>, _fn: (e: never) => Promise<Result$1<NoInfer$2<A$1>, E2>>): Promise<Ok<A$1, E2>>;
  tryRecoverAsync<E2, R extends AnyResult = Result$1<A$1, E$1>>(this: R, _fn: (e: InferErr<R>) => Promise<Result$1<NoInfer$2<InferSuccess<R>>, E2>>): Promise<TryRecoverReturn<R, E2>>;
  /**
   * Chains Result-returning function.
   *
   * @template B New success type.
   * @template E2 New error type.
   * @param fn Function returning Result.
   * @returns Result from fn.
   * @throws {Panic} If fn throws.
   *
   * @example
   * ok(2).andThen(x => x > 0 ? ok(x) : err("negative")) // Ok(2)
   */
  andThen<B, E2>(this: Ok<A$1, E$1>, fn: (a: A$1) => Result$1<B, E2>): Result$1<B, E$1 | E2>;
  andThen<B, E2, R extends AnyResult = Result$1<A$1, E$1>>(this: R, fn: (a: InferOk<R>) => Result$1<B, E2>): AndThenReturn<R, B, E2>;
  /**
   * Chains async Result-returning function.
   *
   * @template B New success type.
   * @template E2 New error type.
   * @param fn Async function returning Result.
   * @returns Promise of Result from fn.
   * @throws {Panic} If fn throws synchronously or rejects.
   *
   * @example
   * await ok(1).andThenAsync(async x => ok(await fetchData(x)))
   */
  andThenAsync<B, E2>(this: Ok<A$1, E$1>, fn: (a: A$1) => Promise<Result$1<B, E2>>): Promise<Result$1<B, E$1 | E2>>;
  andThenAsync<B, E2, R extends AnyResult = Result$1<A$1, E$1>>(this: R, fn: (a: InferOk<R>) => Promise<Result$1<B, E2>>): Promise<AndThenReturn<R, B, E2>>;
  /**
   * Pattern matches on Result.
   *
   * @template T Return type.
   * @param handlers Ok and err handlers.
   * @returns Result of ok handler.
   * @throws {Panic} If handler throws.
   *
   * @example
   * ok(2).match({ ok: x => x * 2, err: () => 0 }) // 4
   */
  match<T$1>(this: Ok<A$1, E$1>, handlers: {
    ok: (a: A$1) => T$1;
    err: (e: never) => T$1;
  }): T$1;
  match<T$1, R extends AnyResult = Result$1<A$1, E$1>>(this: R, handlers: {
    ok: (a: InferOk<R>) => T$1;
    err: (e: InferErr<R>) => T$1;
  }): T$1;
  /**
   * Extracts value.
   *
   * @param _message Ignored.
   * @returns The value.
   *
   * @example
   * ok(42).unwrap() // 42
   */
  unwrap(_message?: string): A$1;
  /**
   * Returns value, ignoring fallback.
   *
   * @template B Fallback type.
   * @param _fallback Ignored.
   * @returns The value.
   *
   * @example
   * ok(42).unwrapOr(0) // 42
   */
  unwrapOr<B>(_fallback: B): A$1;
  /**
   * Runs side effect, returns self.
   *
   * @param fn Side effect function.
   * @returns Self.
   * @throws {Panic} If fn throws.
   *
   * @example
   * ok(2).tap(console.log).map(x => x * 2) // logs 2, returns Ok(4)
   */
  tap(this: Ok<A$1, E$1>, fn: (a: A$1) => void): Ok<A$1, E$1>;
  tap<R extends AnyResult = Result$1<A$1, E$1>>(this: R, fn: (a: InferOk<R>) => void): R;
  /**
   * Runs async side effect, returns self.
   *
   * @param fn Async side effect function.
   * @returns Promise of self.
   * @throws {Panic} If fn throws synchronously or rejects.
   *
   * @example
   * await ok(2).tapAsync(async x => await log(x))
   */
  tapAsync(this: Ok<A$1, E$1>, fn: (a: A$1) => Promise<void>): Promise<Ok<A$1, E$1>>;
  tapAsync<R extends AnyResult = Result$1<A$1, E$1>>(this: R, fn: (a: InferOk<R>) => Promise<void>): Promise<R>;
  /**
   * No-op on Ok, returns self.
   *
   * @param _fn Ignored.
   * @returns Self.
   */
  tapError(this: Ok<A$1, E$1>, _fn: (e: never) => void): Ok<A$1, E$1>;
  tapError<R extends AnyResult = Result$1<A$1, E$1>>(this: R, _fn: (e: InferErr<R>) => void): R;
  /**
   * No-op on Ok, returns Promise of self.
   *
   * @param _fn Ignored.
   * @returns Promise of self.
   */
  tapErrorAsync(this: Ok<A$1, E$1>, _fn: (e: never) => Promise<void>): Promise<Ok<A$1, E$1>>;
  tapErrorAsync<R extends AnyResult = Result$1<A$1, E$1>>(this: R, _fn: (e: InferErr<R>) => Promise<void>): Promise<R>;
  /**
   * Runs ok side effect, skips err side effect, returns self.
   *
   * @param handlers Ok and err side effect handlers.
   * @returns Self.
   * @throws {Panic} If ok handler throws.
   */
  tapBoth(this: Ok<A$1, E$1>, handlers: TapBothOkHandlers<A$1>): Ok<A$1, E$1>;
  tapBoth<R extends AnyResult = Result$1<A$1, E$1>>(this: R, handlers: TapBothHandlersFor<R>): R;
  /**
   * Runs async ok side effect, skips err side effect, returns self.
   *
   * @param handlers Ok and err async side effect handlers.
   * @returns Promise of self.
   * @throws {Panic} If ok handler throws synchronously or rejects.
   */
  tapBothAsync(this: Ok<A$1, E$1>, handlers: TapBothAsyncOkHandlers<A$1>): Promise<Ok<A$1, E$1>>;
  tapBothAsync<R extends AnyResult = Result$1<A$1, E$1>>(this: R, handlers: TapBothAsyncHandlersFor<R>): Promise<R>;
  /**
   * Makes Ok yieldable in Result.gen blocks.
   * Immediately returns the value without yielding.
   * Yield type Err<never, E> matches Err's for proper union inference.
   */
  [Symbol.iterator](): Generator<Err<never, E$1>, A$1, unknown>;
}
/**
 * Error result variant.
 *
 * @template T Success type (phantom - for type unification with Ok).
 * @template E Error value type.
 *
 * @example
 * const result = new Err("failed");
 * result.error // "failed"
 * result.status // "error"
 */
declare class Err<T$1, E$1> {
  readonly error: E$1;
  readonly status: "error";
  constructor(error: E$1);
  /** Returns false, narrowing Result to Ok. */
  isOk(): this is Ok<never, E$1>;
  /** Returns true, narrowing Result to Err. */
  isErr(): this is Err<T$1, E$1>;
  /**
   * No-op on Err, returns self with new phantom T.
   *
   * @template U New phantom success type.
   * @param _fn Ignored.
   * @returns Self.
   */
  map<U>(this: Err<T$1, E$1>, _fn: (a: never) => U): Err<U, E$1>;
  map<U, R extends AnyResult = Result$1<T$1, E$1>>(this: R, _fn: (a: InferOk<R>) => U): MapReturn<R, U>;
  /**
   * Transforms error value.
   *
   * @template E2 Transformed error type.
   * @param fn Transformation function.
   * @returns Err with transformed error.
   * @throws {Panic} If fn throws.
   *
   * @example
   * err("fail").mapError(e => new Error(e)) // Err(Error("fail"))
   */
  mapError<E2>(this: Err<T$1, E$1>, fn: (e: E$1) => E2): Err<T$1, E2>;
  mapError<E2, R extends AnyResult = Result$1<T$1, E$1>>(this: R, fn: (e: InferErr<R>) => E2): MapErrorReturn<R, E2>;
  /**
   * Attempts to recover from Err into the same success type.
   *
   * @template E2 New error type.
   * @param fn Recovery function returning Result with the same success type.
   * @returns Result from fn.
   * @throws {Panic} If fn throws.
   *
   * @example
   * err<number, string>("missing").tryRecover(e => e === "missing" ? ok(0) : err(new Error(e))) // Ok(0)
   */
  tryRecover<E2>(this: Err<T$1, E$1>, fn: (e: E$1) => Result$1<NoInfer$2<T$1>, E2>): Result$1<T$1, E2>;
  tryRecover<E2, R extends AnyResult = Result$1<T$1, E$1>>(this: R, fn: (e: InferErr<R>) => Result$1<NoInfer$2<InferSuccess<R>>, E2>): TryRecoverReturn<R, E2>;
  /**
   * Attempts to recover from Err into the same success type asynchronously.
   *
   * @template E2 New error type.
   * @param fn Async recovery function returning Result with the same success type.
   * @returns Promise of Result from fn.
   * @throws {Panic} If fn throws synchronously or rejects.
   *
   * @example
   * await err<number, string>("missing").tryRecoverAsync(async e => e === "missing" ? ok(0) : err(new Error(e))) // Ok(0)
   */
  tryRecoverAsync<E2>(this: Err<T$1, E$1>, fn: (e: E$1) => Promise<Result$1<NoInfer$2<T$1>, E2>>): Promise<Result$1<T$1, E2>>;
  tryRecoverAsync<E2, R extends AnyResult = Result$1<T$1, E$1>>(this: R, fn: (e: InferErr<R>) => Promise<Result$1<NoInfer$2<InferSuccess<R>>, E2>>): Promise<TryRecoverReturn<R, E2>>;
  /**
   * No-op on Err, returns self with widened error type.
   *
   * @template U New phantom success type.
   * @template E2 Additional error type.
   * @param _fn Ignored.
   * @returns Self.
   */
  andThen<U, E2>(this: Err<T$1, E$1>, _fn: (a: never) => Result$1<U, E2>): Err<U, E$1 | E2>;
  andThen<U, E2, R extends AnyResult = Result$1<T$1, E$1>>(this: R, _fn: (a: InferOk<R>) => Result$1<U, E2>): AndThenReturn<R, U, E2>;
  /**
   * No-op on Err, returns Promise of self with widened error type.
   *
   * @template U New phantom success type.
   * @template E2 Additional error type.
   * @param _fn Ignored.
   * @returns Promise of self.
   */
  andThenAsync<U, E2>(this: Err<T$1, E$1>, _fn: (a: never) => Promise<Result$1<U, E2>>): Promise<Err<U, E$1 | E2>>;
  andThenAsync<U, E2, R extends AnyResult = Result$1<T$1, E$1>>(this: R, _fn: (a: InferOk<R>) => Promise<Result$1<U, E2>>): Promise<AndThenReturn<R, U, E2>>;
  /**
   * Pattern matches on Result.
   *
   * @template R Return type.
   * @param handlers Ok and err handlers.
   * @returns Result of err handler.
   * @throws {Panic} If handler throws.
   *
   * @example
   * err("fail").match({ ok: x => x, err: e => e.length }) // 4
   */
  match<U>(this: Err<T$1, E$1>, handlers: {
    ok: (a: never) => U;
    err: (e: E$1) => U;
  }): U;
  match<U, R extends AnyResult = Result$1<T$1, E$1>>(this: R, handlers: {
    ok: (a: InferOk<R>) => U;
    err: (e: InferErr<R>) => U;
  }): U;
  /**
   * Throws error with optional message.
   *
   * @param message Error message.
   * @throws Always throws.
   *
   * @example
   * err("fail").unwrap() // throws Error
   * err("fail").unwrap("custom") // throws Error("custom")
   */
  unwrap(message?: string): never;
  /**
   * Returns fallback value.
   *
   * @template U Fallback type.
   * @param fallback Fallback value.
   * @returns Fallback.
   *
   * @example
   * err("fail").unwrapOr(42) // 42
   */
  unwrapOr<U>(fallback: U): T$1 | U;
  /**
   * No-op on Err, returns self.
   *
   * @param _fn Ignored.
   * @returns Self.
   */
  tap(this: Err<T$1, E$1>, _fn: (a: never) => void): Err<T$1, E$1>;
  tap<R extends AnyResult = Result$1<T$1, E$1>>(this: R, _fn: (a: InferOk<R>) => void): R;
  /**
   * Runs side effect on error, returns self.
   *
   * @param fn Side effect function.
   * @returns Self.
   * @throws {Panic} If fn throws.
   *
   * @example
   * err("fail").tapError(console.error) // logs "fail", returns Err("fail")
   */
  tapError(this: Err<T$1, E$1>, fn: (e: E$1) => void): Err<T$1, E$1>;
  tapError<R extends AnyResult = Result$1<T$1, E$1>>(this: R, fn: (e: InferErr<R>) => void): R;
  /**
   * No-op on Err, returns Promise of self.
   *
   * @param _fn Ignored.
   * @returns Promise of self.
   */
  tapAsync(this: Err<T$1, E$1>, _fn: (a: never) => Promise<void>): Promise<Err<T$1, E$1>>;
  tapAsync<R extends AnyResult = Result$1<T$1, E$1>>(this: R, _fn: (a: InferOk<R>) => Promise<void>): Promise<R>;
  /**
   * Runs async side effect on error, returns self.
   *
   * @param fn Async side effect function.
   * @returns Promise of self.
   * @throws {Panic} If fn throws synchronously or rejects.
   *
   * @example
   * await err("fail").tapErrorAsync(async e => await trace("request.failed", { e }))
   */
  tapErrorAsync(this: Err<T$1, E$1>, fn: (e: E$1) => Promise<void>): Promise<Err<T$1, E$1>>;
  tapErrorAsync<R extends AnyResult = Result$1<T$1, E$1>>(this: R, fn: (e: InferErr<R>) => Promise<void>): Promise<R>;
  /**
   * Skips ok side effect, runs err side effect, returns self.
   *
   * @param handlers Ok and err side effect handlers.
   * @returns Self.
   * @throws {Panic} If err handler throws.
   */
  tapBoth(this: Err<T$1, E$1>, handlers: TapBothErrHandlers<E$1>): Err<T$1, E$1>;
  tapBoth<R extends AnyResult = Result$1<T$1, E$1>>(this: R, handlers: TapBothHandlersFor<R>): R;
  /**
   * Skips async ok side effect, runs async err side effect, returns self.
   *
   * @param handlers Ok and err async side effect handlers.
   * @returns Promise of self.
   * @throws {Panic} If err handler throws synchronously or rejects.
   */
  tapBothAsync(this: Err<T$1, E$1>, handlers: TapBothAsyncErrHandlers<E$1>): Promise<Err<T$1, E$1>>;
  tapBothAsync<R extends AnyResult = Result$1<T$1, E$1>>(this: R, handlers: TapBothAsyncHandlersFor<R>): Promise<R>;
  /**
   * Makes Err yieldable in Result.gen blocks.
   * Yields Err<never, E> for proper union inference across multiple yields.
   */
  [Symbol.iterator](): Generator<Err<never, E$1>, never, unknown>;
}
/**
 * Discriminated union representing operation success or failure.
 *
 * Both Ok and Err carry phantom types for the "other" variant:
 * - Ok<T, E>: T is value, E is phantom error type
 * - Err<T, E>: T is phantom success type, E is error
 *
 * This symmetric structure enables proper type inference in generator-based composition.
 *
 * @template T Success value type.
 * @template E Error value type.
 *
 * @example
 * type ParseResult = Result<number, ParseError>;
 */
type Result$1<T$1, E$1> = Ok<T$1, E$1> | Err<T$1, E$1>;
/**
 * Infer the Ok value type from a Result.
 * Distributive: InferOk<Ok<A, X> | Ok<B, Y>> = A | B
 */
type InferOk<R> = R extends Ok<infer T, unknown> ? T : never;
/**
 * Infer the Err value type from a Result.
 * Distributive: InferErr<Err<X, A> | Err<Y, B>> = A | B
 */
type InferErr<R> = R extends Err<unknown, infer E> ? E : never;
/**
 * Constraint for any union of Ok/Err types.
 * Used in Result.gen to accept flexible return types from generators.
 */
type AnyResult = Ok<unknown, unknown> | Err<unknown, unknown>;
declare function ok(): Ok<void, never>;
declare function ok<A$1, E$1 = never>(value: A$1): Ok<A$1, E$1>;
//#endregion
//#region src/error.d.ts
/** Any tagged error (for generic constraints) */
type AnyTaggedError = Error & {
  readonly _tag: string;
};
/**
 * Factory for tagged error classes.
 *
 * @example
 * class NotFoundError extends TaggedError("NotFoundError")<{
 *   id: string;
 *   message: string;
 * }>() {}
 *
 * const err = new NotFoundError({ id: "123", message: "Not found: 123" });
 * err._tag    // "NotFoundError"
 * err.id      // "123"
 * err.message // "Not found: 123"
 *
 * // Check if any tagged error
 * TaggedError.is(err) // true
 */
declare const TaggedError: {
  <Tag extends string>(tag: Tag): <Props extends Record<string, unknown> = {}>() => TaggedErrorClass<Tag, Props>;
  /** Type guard for any TaggedError instance */
  is(value: unknown): value is AnyTaggedError;
};
interface IterableError extends Error {
  /** Makes TaggedError instances yieldable in Result.gen blocks. */
  [Symbol.iterator](): Generator<Err<never, this>, never, unknown>;
}
/** Instance type produced by TaggedError factory */
type TaggedErrorInstance<Tag extends string, Props> = IterableError & {
  readonly _tag: Tag;
  toJSON(): object;
} & Readonly<Props>;
/** Class type produced by TaggedError factory */
type TaggedErrorClass<Tag extends string, Props> = {
  new (...args: keyof Props extends never ? [args?: {}] : [args: Props]): TaggedErrorInstance<Tag, Props>;
  /** Type guard for this error class */
  is(value: unknown): value is TaggedErrorInstance<Tag, Props>;
};
/** Handler map for exhaustive matching */
type MatchHandlers<E$1 extends AnyTaggedError, R> = { [K in E$1["_tag"]]: (err: Extract<E$1, {
  _tag: K;
}>) => R };
/** Partial handler map for non-exhaustive matching */
type PartialMatchHandlers<E$1 extends AnyTaggedError, R> = Partial<MatchHandlers<E$1, R>>;
/** Extract handled tags from a handlers object */
type HandledTags<E$1 extends AnyTaggedError, H> = Extract<keyof H, E$1["_tag"]>;
/**
 * Exhaustive pattern match on tagged error union.
 *
 * @example
 * // Data-first
 * matchError(err, {
 *   NotFoundError: (e) => `Missing: ${e.id}`,
 *   ValidationError: (e) => `Invalid: ${e.field}`,
 * });
 *
 * // Data-last (pipeable)
 * pipe(err, matchError({
 *   NotFoundError: (e) => `Missing: ${e.id}`,
 *   ValidationError: (e) => `Invalid: ${e.field}`,
 * }));
 */
declare const matchError: {
  <E$1 extends AnyTaggedError, R>(handlers: MatchHandlers<E$1, R>): (err: E$1) => R;
  <E$1 extends AnyTaggedError, R>(err: E$1, handlers: MatchHandlers<E$1, R>): R;
};
/**
 * Partial pattern match with fallback for unhandled tags.
 *
 * @example
 * matchErrorPartial(err, {
 *   NotFoundError: (e) => `Missing: ${e.id}`,
 * }, (e) => `Unknown: ${e.message}`);
 */
declare const matchErrorPartial: {
  <E$1 extends AnyTaggedError, R, const H extends PartialMatchHandlers<E$1, R> = PartialMatchHandlers<E$1, R>>(handlers: H, fallback: (e: Exclude<E$1, {
    _tag: NoInfer<HandledTags<E$1, H>>;
  }>) => R): (err: E$1) => R;
  <E$1 extends AnyTaggedError, R, const H extends PartialMatchHandlers<E$1, R>>(err: E$1, handlers: H, fallback: (e: Exclude<E$1, {
    _tag: NoInfer<HandledTags<E$1, H>>;
  }>) => R): R;
};
/**
 * Type guard for tagged error instances.
 *
 * @example
 * if (isTaggedError(value)) { value._tag }
 */
declare const isTaggedError: (value: unknown) => value is AnyTaggedError;
declare const UnhandledException_base: TaggedErrorClass<"UnhandledException", {
  message: string;
  cause: unknown;
}>;
/**
 * Wraps exceptions caught by Result.try/tryPromise.
 * Custom constructor derives message from cause.
 */
declare class UnhandledException extends UnhandledException_base {
  constructor(args: {
    cause: unknown;
  });
}
declare const ResultDeserializationError_base: TaggedErrorClass<"ResultDeserializationError", {
  message: string;
  value: unknown;
}>;
/**
 * Returned when Result.deserialize receives invalid input.
 *
 * @example
 * const result = Result.deserialize(invalidData);
 * if (Result.isError(result) && ResultDeserializationError.is(result.error)) {
 *   console.log("Invalid input:", result.error.value);
 * }
 */
declare class ResultDeserializationError extends ResultDeserializationError_base {
  constructor(args: {
    value: unknown;
  });
}
//#endregion
//#region src/result.d.ts
type Result<T$1, E$1> = Result$1<T$1, E$1>;
/**
 * Extracts error type E from yield union in Result.gen.
 * Yields are always Err<never, E>, so we match on that pattern.
 * Distributive conditional: InferYieldErr<Err<never, A> | Err<never, B>> = A | B
 */
type InferYieldErr<Y> = Y extends Err<never, infer E> ? E : never;
type NoInfer$1<T$1> = [T$1][T$1 extends unknown ? 0 : never];
type RetryConfig<E$1 = unknown> = {
  retry?: {
    times: number;
    delayMs: number;
    backoff: "linear" | "constant" | "exponential";
    /** Predicate to determine if an error should trigger a retry. Defaults to always retry. */
    shouldRetry?: (error: E$1) => boolean;
  };
};
declare function resultAwait<T$1, E$1>(promise: Promise<Result<T$1, E$1>>): AsyncGenerator<Err<never, E$1>, T$1, unknown>;
/** Shape of a serialized Ok over RPC. */
interface SerializedOk<T$1> {
  status: "ok";
  value: T$1;
}
/** Shape of a serialized Err over RPC. */
interface SerializedErr<E$1> {
  status: "error";
  error: E$1;
}
/** Shape of a serialized Result over RPC. */
type SerializedResult<T$1, E$1> = SerializedOk<T$1> | SerializedErr<E$1>;
/**
 * Utilities for creating and handling Result types.
 *
 * @example
 * const result = Result.try(() => JSON.parse(str));
 * const value = result.map(x => x.id).unwrapOr("default");
 */
declare const Result: {
  /**
   * Creates successful result.
   *
   * @example
   * Result.ok(42)  // Ok<number, never>
   * Result.ok()    // Ok<void, never> - for side-effectful operations
   */
  readonly ok: typeof ok;
  /**
   * Type guard for Ok.
   *
   * @example
   * if (Result.isOk(result)) { result.value }
   */
  readonly isOk: <A$1, E$1>(result: Result$1<A$1, E$1>) => result is Ok<A$1, E$1>;
  /**
   * Creates error result.
   *
   * @example
   * Result.err("failed") // Err("failed")
   */
  readonly err: <T$1 = never, E$1 = unknown>(error: E$1) => Err<T$1, E$1>;
  /**
   * Type guard for Err.
   *
   * @example
   * if (Result.isError(result)) { result.error }
   */
  readonly isError: <T$1, E$1>(result: Result$1<T$1, E$1>) => result is Err<T$1, E$1>;
  /**
   * Executes sync function, wraps result/error in Result.
   *
   * @example
   * Result.try(() => JSON.parse(str))
   * Result.try({ try: () => parse(x), catch: e => new ParseError(e) })
   */
  readonly try: {
    <A$1, E$1>(options: {
      try: () => Awaited<A$1>;
      catch: (cause: unknown) => Awaited<E$1>;
    }, config?: {
      retry?: {
        times: number;
      };
    }): Result<A$1, E$1>;
    <A$1>(thunk: () => Awaited<A$1>, config?: {
      retry?: {
        times: number;
      };
    }): Result<A$1, UnhandledException>;
  };
  /**
   * Executes async function, wraps result/error in Result with retry support.
   *
   * @example
   * // Basic retry
   * await Result.tryPromise(() => fetch(url), {
   *   retry: { times: 3, delayMs: 100, backoff: "exponential" }
   * })
   *
   * @example
   * // Retry only for specific error types (user-defined TaggedError classes)
   * await Result.tryPromise({
   *   try: () => fetch(url),
   *   catch: e => e instanceof TypeError ? new RetryableError(e) : new FatalError(e)
   * }, {
   *   retry: {
   *     times: 3,
   *     delayMs: 100,
   *     backoff: "exponential",
   *     shouldRetry: e => e._tag === "RetryableError"
   *   }
   * })
   *
   * @example
   * // Async retry decisions: enrich error in catch handler
   * await Result.tryPromise({
   *   try: () => callApi(url),
   *   catch: async (e) => {
   *     const limited = await redis.get(`ratelimit:${userId}`);
   *     return new ApiError({ cause: e, rateLimited: !!limited });
   *   }
   * }, {
   *   retry: { times: 3, delayMs: 100, backoff: "exponential", shouldRetry: e => !e.rateLimited }
   * })
   */
  readonly tryPromise: {
    <A$1, E$1>(options: {
      try: () => Promise<A$1>;
      catch: (cause: unknown) => E$1 | Promise<E$1>;
    }, config?: RetryConfig<E$1>): Promise<Result<A$1, E$1>>;
    <A$1>(thunk: () => Promise<A$1>, config?: RetryConfig<UnhandledException>): Promise<Result<A$1, UnhandledException>>;
  };
  /**
   * Transforms success value, passes error through.
   *
   * @example
   * Result.map(ok(2), x => x * 2) // Ok(4)
   * Result.map(x => x * 2)(ok(2)) // Ok(4)
   */
  readonly map: {
    <A$1, B, E$1>(result: Result<A$1, E$1>, fn: (a: A$1) => B): Result<B, E$1>;
    <A$1, B>(fn: (a: A$1) => B): <E$1>(result: Result<A$1, E$1>) => Result<B, E$1>;
  };
  /**
   * Transforms error value, passes success through.
   *
   * @example
   * Result.mapError(err("fail"), e => new Error(e)) // Err(Error("fail"))
   */
  readonly mapError: {
    <A$1, E$1, E2>(result: Result<A$1, E$1>, fn: (e: E$1) => E2): Result<A$1, E2>;
    <E$1, E2>(fn: (e: E$1) => E2): <A$1>(result: Result<A$1, E$1>) => Result<A$1, E2>;
  };
  /**
   * Attempts to recover from an error into the same success type.
   *
   * @example
   * Result.tryRecover(err("fail"), e => ok(e.length)) // Ok(4)
   * Result.tryRecover(e => ok(e.length))(err("fail")) // Ok(4)
   */
  readonly tryRecover: {
    <A$1, E$1, E2>(result: Result<A$1, E$1>, fn: (e: E$1) => Result<NoInfer$1<A$1>, E2>): Result<A$1, E2>;
    <E$1, E2>(fn: (e: E$1) => Result<never, E2>): <A$1>(result: Result<A$1, E$1>) => Result<A$1, E2>;
    <E$1, A$1, E2>(fn: (e: E$1) => Result<A$1, E2>): (result: Result<A$1, E$1>) => Result<A$1, E2>;
  };
  /**
   * Chains Result-returning function on success.
   *
   * @example
   * Result.andThen(ok(2), x => x > 0 ? ok(x) : err("neg")) // Ok(2)
   */
  readonly andThen: {
    <A$1, B, E$1, E2>(result: Result<A$1, E$1>, fn: (a: A$1) => Result<B, E2>): Result<B, E$1 | E2>;
    <A$1, B, E2>(fn: (a: A$1) => Result<B, E2>): <E$1>(result: Result<A$1, E$1>) => Result<B, E$1 | E2>;
  };
  /**
   * Attempts to recover from an error into the same success type asynchronously.
   *
   * @example
   * await Result.tryRecoverAsync(err("fail"), async e => ok(e.length)) // Ok(4)
   * await Result.tryRecoverAsync(async e => ok(e.length))(err("fail")) // Ok(4)
   */
  readonly tryRecoverAsync: {
    <A$1, E$1, E2>(result: Result<A$1, E$1>, fn: (e: E$1) => Promise<Result<NoInfer$1<A$1>, E2>>): Promise<Result<A$1, E2>>;
    <E$1, E2>(fn: (e: E$1) => Promise<Result<never, E2>>): <A$1>(result: Result<A$1, E$1>) => Promise<Result<A$1, E2>>;
    <E$1, A$1, E2>(fn: (e: E$1) => Promise<Result<A$1, E2>>): (result: Result<A$1, E$1>) => Promise<Result<A$1, E2>>;
  };
  /**
   * Chains async Result-returning function on success.
   *
   * @example
   * await Result.andThenAsync(ok(1), async x => ok(await fetch(x)))
   */
  readonly andThenAsync: {
    <A$1, B, E$1, E2>(result: Result<A$1, E$1>, fn: (a: A$1) => Promise<Result<B, E2>>): Promise<Result<B, E$1 | E2>>;
    <A$1, B, E2>(fn: (a: A$1) => Promise<Result<B, E2>>): <E$1>(result: Result<A$1, E$1>) => Promise<Result<B, E$1 | E2>>;
  };
  /**
   * Pattern matches on Result.
   *
   * @example
   * Result.match(ok(2), { ok: x => x * 2, err: () => 0 }) // 4
   */
  readonly match: {
    <A$1, E$1, T$1>(handlers: {
      ok: (a: A$1) => T$1;
      err: (e: E$1) => T$1;
    }): (result: Result<A$1, E$1>) => T$1;
    <A$1, E$1, T$1>(result: Result<A$1, E$1>, handlers: {
      ok: (a: A$1) => T$1;
      err: (e: E$1) => T$1;
    }): T$1;
  };
  /**
   * Runs side effect on success value, returns original result.
   *
   * @example
   * Result.tap(ok(2), console.log) // logs 2, returns Ok(2)
   */
  readonly tap: {
    <A$1, E$1>(result: Result<A$1, E$1>, fn: (a: A$1) => void): Result<A$1, E$1>;
    <A$1>(fn: (a: A$1) => void): <E$1>(result: Result<A$1, E$1>) => Result<A$1, E$1>;
  };
  /**
   * Runs async side effect on success value, returns original result.
   *
   * @example
   * await Result.tapAsync(ok(2), async x => await log(x))
   */
  readonly tapAsync: {
    <A$1, E$1>(result: Result<A$1, E$1>, fn: (a: A$1) => Promise<void>): Promise<Result<A$1, E$1>>;
    <A$1>(fn: (a: A$1) => Promise<void>): <E$1>(result: Result<A$1, E$1>) => Promise<Result<A$1, E$1>>;
  };
  /**
   * Runs side effect on error value, returns original result.
   *
   * @example
   * Result.tapError(err("fail"), console.error) // logs "fail", returns Err("fail")
   * Result.tapError(console.error)(err("fail")) // logs "fail", returns Err("fail")
   */
  readonly tapError: {
    <A$1, E$1>(result: Result<A$1, E$1>, fn: (e: E$1) => void): Result<A$1, E$1>;
    <E$1>(fn: (e: E$1) => void): <A$1>(result: Result<A$1, E$1>) => Result<A$1, E$1>;
  };
  /**
   * Runs async side effect on error value, returns original result.
   *
   * @example
   * await Result.tapErrorAsync(err("fail"), async e => await reportError(e))
   * await Result.tapErrorAsync(async e => await reportError(e))(err("fail"))
   */
  readonly tapErrorAsync: {
    <A$1, E$1>(result: Result<A$1, E$1>, fn: (e: E$1) => Promise<void>): Promise<Result<A$1, E$1>>;
    <E$1>(fn: (e: E$1) => Promise<void>): <A$1>(result: Result<A$1, E$1>) => Promise<Result<A$1, E$1>>;
  };
  /**
   * Runs side effect on either branch, returns original result.
   *
   * @example
   * Result.tapBoth(ok(2), { ok: console.log, err: console.error })
   * Result.tapBoth({ ok: console.log, err: console.error })(err("fail"))
   */
  readonly tapBoth: {
    <A$1, E$1>(handlers: TapBothHandlers<A$1, E$1>): (result: Result<A$1, E$1>) => Result<A$1, E$1>;
    <A$1, E$1>(result: Result<A$1, E$1>, handlers: TapBothHandlers<A$1, E$1>): Result<A$1, E$1>;
  };
  /**
   * Runs async side effect on either branch, returns original result.
   *
   * @example
   * await Result.tapBothAsync(ok(2), { ok: async x => await log(x), err: async e => await reportError(e) })
   * await Result.tapBothAsync({ ok: async x => await log(x), err: async e => await reportError(e) })(err("fail"))
   */
  readonly tapBothAsync: {
    <A$1, E$1>(handlers: TapBothAsyncHandlers<A$1, E$1>): (result: Result<A$1, E$1>) => Promise<Result<A$1, E$1>>;
    <A$1, E$1>(result: Result<A$1, E$1>, handlers: TapBothAsyncHandlers<A$1, E$1>): Promise<Result<A$1, E$1>>;
  };
  /**
   * Extracts value or throws.
   *
   * @example
   * Result.unwrap(ok(42)) // 42
   * Result.unwrap(err("fail")) // throws Error
   */
  readonly unwrap: <A$1, E$1>(result: Result<A$1, E$1>, message?: string) => A$1;
  /**
   * Extracts value or returns fallback.
   *
   * @example
   * Result.unwrapOr(ok(42), 0) // 42
   * Result.unwrapOr(err("fail"), 0) // 0
   */
  readonly unwrapOr: {
    <A$1, E$1, B>(result: Result<A$1, E$1>, fallback: B): A$1 | B;
    <B>(fallback: B): <A$1, E$1>(result: Result<A$1, E$1>) => A$1 | B;
  };
  /**
   * Generator-based composition for Result types.
   * Errors from yielded Results form a union; use mapError to normalize.
   *
   * @example
   * const result = Result.gen(function* () {
   *   const a = yield* getA(); // Err: ErrorA
   *   const b = yield* getB(a); // Err: ErrorB
   *   return Result.ok({ a, b });
   * });
   * // Result<{a, b}, ErrorA | ErrorB>
   *
   * @example
   * // Normalize error types with mapError
   * const result = Result.gen(function* () {
   *   const a = yield* getA();
   *   const b = yield* getB(a);
   *   return Result.ok({ a, b });
   * }).mapError(e => new UnifiedError(e._tag, e.message));
   * // Result<{a, b}, UnifiedError>
   *
   * @example
   * // Async with Result.await
   * const result = await Result.gen(async function* () {
   *   const a = yield* Result.await(fetchA());
   *   const b = yield* Result.await(fetchB(a));
   *   return Result.ok({ a, b });
   * });
   */
  readonly gen: {
    <Yield extends Err<never, unknown>, R extends AnyResult>(body: () => Generator<Yield, R, unknown>): Result<InferOk<R>, InferYieldErr<Yield> | InferErr<R>>;
    <Yield extends Err<never, unknown>, R extends AnyResult, This>(body: (this: This) => Generator<Yield, R, unknown>, thisArg: This): Result<InferOk<R>, InferYieldErr<Yield> | InferErr<R>>;
    <Yield extends Err<never, unknown>, R extends AnyResult>(body: () => AsyncGenerator<Yield, R, unknown>): Promise<Result<InferOk<R>, InferYieldErr<Yield> | InferErr<R>>>;
    <Yield extends Err<never, unknown>, R extends AnyResult, This>(body: (this: This) => AsyncGenerator<Yield, R, unknown>, thisArg: This): Promise<Result<InferOk<R>, InferYieldErr<Yield> | InferErr<R>>>;
  };
  /**
   * Wraps Promise<Result> to be yieldable in async Result.gen blocks.
   *
   * @example
   * yield* Result.await(fetchUser(id))
   */
  readonly await: typeof resultAwait;
  /**
   * Converts a Result to a plain object for serialization (e.g., RPC, server actions).
   *
   * @example
   * const serialized = Result.serialize(ok(42)); // { status: "ok", value: 42 }
   */
  readonly serialize: <T$1, E$1>(result: Result<T$1, E$1>) => SerializedResult<T$1, E$1>;
  /**
   * Rehydrates serialized Result from RPC back into Ok/Err instances.
   * Returns `Err<ResultDeserializationError>` if the input is not a valid serialized Result.
   *
   * @example
   * // Valid serialized Result
   * const result = Result.deserialize<User, AppError>(rpcResponse);
   * if (Result.isOk(result)) {
   *   console.log(result.value); // User
   * }
   *
   * // Invalid input returns ResultDeserializationError
   * const invalid = Result.deserialize({ foo: "bar" });
   * if (Result.isError(invalid) && ResultDeserializationError.is(invalid.error)) {
   *   console.log("Bad input:", invalid.error.value);
   * }
   */
  readonly deserialize: <T$1, E$1>(value: unknown) => Result<T$1, E$1 | ResultDeserializationError>;
  /**
   * @deprecated Use `Result.deserialize` instead. Will be removed in 3.0.
   */
  readonly hydrate: <T$1, E$1>(value: unknown) => Result<T$1, E$1 | ResultDeserializationError>;
  /**
   * Splits array of Results into tuple of [okValues, errorValues].
   *
   * @example
   * partition([ok(1), err("a"), ok(2)]) // [[1, 2], ["a"]]
   */
  readonly partition: <T$1, E$1>(results: readonly Result<T$1, E$1>[]) => [T$1[], E$1[]];
  /**
   * Flattens nested Result into single Result.
   *
   * @example
   * const nested = Result.ok(Result.ok(42));
   * Result.flatten(nested) // Ok(42)
   */
  readonly flatten: <T$1, E$1, E2>(result: Result<Result<T$1, E$1>, E2>) => Result<T$1, E$1 | E2>;
};
//#endregion
export { Err, type InferErr, type InferOk, Ok, Panic, Result, ResultDeserializationError, type SerializedErr, type SerializedOk, type SerializedResult, TaggedError, type TaggedErrorClass, type TaggedErrorInstance, UnhandledException, isPanic, isTaggedError, matchError, matchErrorPartial, panic };
//# sourceMappingURL=index.d.mts.map
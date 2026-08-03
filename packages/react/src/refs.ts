import * as React from "react";

/**
 * Fan-outs a DOM node to multiple refs.
 *
 * React does not compose refs automatically, but wrapper components need to
 * preserve user refs while also attaching Popright's core target ref.
 */
export function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> {
  return (value) => {
    const cleanups: Array<() => void> = [];

    for (const ref of refs) {
      if (typeof ref === "function") {
        const cleanup = ref(value);
        cleanups.push(typeof cleanup === "function" ? cleanup : () => ref(null));
      } else if (ref) {
        ref.current = value;
        cleanups.push(() => {
          ref.current = null;
        });
      }
    }

    if (value !== null && Number.parseInt(React.version, 10) >= 19) {
      return () => cleanups.forEach((cleanup) => cleanup());
    }
  };
}

/**
 * Reads the ref from a React element in one compatibility shim.
 *
 * React's public typing around element refs has shifted across versions; hiding
 * the cast here keeps the component wrapper from spreading that detail around.
 */
export function getElementRef<T>(element: React.ReactElement | null): React.Ref<T> | undefined {
  if (!element) {
    return undefined;
  }

  const propsRef = (element.props as { ref?: React.Ref<T> }).ref;
  if (propsRef !== undefined || React.version.startsWith("19.")) {
    return propsRef;
  }

  return (element as React.ReactElement & { ref?: React.Ref<T> }).ref;
}

import { useEffect, useState } from "react";
import { Keyboard, Platform } from "react-native";

/**
 * Returns the current keyboard height in px (0 when hidden).
 *
 * Built-in KeyboardAvoidingView infers offset from window-resize deltas,
 * which breaks on Android once edge-to-edge is enabled (default since Expo
 * SDK 54 - the window no longer resizes the way it expects). This instead
 * reads the keyboard's actual reported height directly from the native
 * show/hide events, which fire correctly regardless of edge-to-edge, and
 * needs no native module of its own - just React Native's built-in
 * Keyboard API.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    const showEvent = Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow";
    const hideEvent = Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide";

    const showSub = Keyboard.addListener(showEvent, (e) => {
      setHeight(e.endCoordinates?.height ?? 0);
    });
    const hideSub = Keyboard.addListener(hideEvent, () => {
      setHeight(0);
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  return height;
}
import { useTheme } from "@/contexts/ThemeContext";
import { BlurView } from "expo-blur";
import Fuse from "fuse.js";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  FlatList,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from "react-native";

const colors = {
  chrome: "#F5F5F7",
  silver: "#C9C9CE",
  steel: "#8E8E93",
  hairline: "#2C2C30",
  onyxRaised: "#1C1C1F",
};

export function useAutocomplete({
  items,
  searchKeys,
  value,
  minChars = 2,
  maxSuggestions = 6,
}) {
  const [open, setOpen] = useState(false);

  const fuse = useMemo(
    () =>
      new Fuse(items ?? [], {
        keys: searchKeys,
        threshold: 0.35,
        ignoreLocation: true,
        minMatchCharLength: 2,
      }),
    [items, searchKeys],
  );

  const query = (value ?? "").trim();
  const suggestions =
    query.length >= minChars
      ? fuse.search(query, { limit: maxSuggestions }).map((r) => r.item)
      : [];

  return { open, setOpen, suggestions };
}

// Measures where a search box actually sits on screen so the suggestions can
// open directly beneath it. Hardcoded offsets drifted whenever a header or
// pill changed height, and left the list covering the search box itself.
// Attach `anchorRef` / `onAnchorLayout` to the view wrapping the input (with
// collapsable={false}), then pass `dropdownTop` as `topOffset` and
// `dropdownStyle` as `style` so the list lines up with the box's own edges.
export function useDropdownAnchor(open) {
  const { width: windowWidth } = useWindowDimensions();
  const anchorRef = useRef(null);
  const [anchor, setAnchor] = useState(null);

  const measure = useCallback(() => {
    anchorRef.current?.measureInWindow((x, y, width, height) => {
      setAnchor({ x, width, top: y + height + 8 });
    });
  }, []);

  useEffect(() => {
    if (open) measure();
  }, [open, measure]);

  return {
    anchorRef,
    onAnchorLayout: measure,
    dropdownTop: anchor?.top ?? null,
    dropdownStyle: anchor
      ? { left: anchor.x, right: windowWidth - anchor.x - anchor.width }
      : undefined,
  };
}

export function SuggestionsDropdown({
  visible,
  suggestions,
  getLabel,
  getSublabel,
  getKey,
  onSelect,
  onDismiss,
  topOffset = 58,
  style,
}) {
  const { isDark } = useTheme();
  const { height: screenHeight } = useWindowDimensions();
  const shouldShow = visible && !!suggestions?.length;

  // The backdrop + BlurView stay mounted permanently and are only toggled via
  // opacity/pointerEvents. Mounting a brand-new native BlurView surface while
  // the soft keyboard is showing is what was causing Android to dismiss the
  // keyboard the instant suggestions first appeared (worse on screens like
  // Syllabus that already have several BlurViews on screen).
  return (
    <>
      {/* Full-screen scrim so whatever is beneath the suggestions (filter
          pills, tabs, result cards) reads as blurred-out background instead
          of competing with the list on top of it. */}
      <Pressable
        style={[
          styles.backdrop,
          { top: topOffset, height: screenHeight },
          !shouldShow && styles.hidden,
        ]}
        pointerEvents={shouldShow ? "auto" : "none"}
        onPress={() => {
          Keyboard.dismiss();
          onDismiss?.();
        }}
      >
        <BlurView intensity={45} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} />
        {/* On Android the blur can be faint, so a wash (matching the theme,
            not always dark) guarantees the content behind the suggestions
            reads as pushed back. */}
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? "rgba(0,0,0,0.55)" : "rgba(255,255,255,0.6)" },
          ]}
        />
      </Pressable>

      <View
        style={[
          styles.dropdown,
          { top: topOffset },
          style,
          !shouldShow && styles.hidden,
        ]}
        pointerEvents={shouldShow ? "auto" : "none"}
      >
        <FlatList
          style={styles.dropdownList}
          data={suggestions}
          keyExtractor={getKey}
          keyboardShouldPersistTaps="handled"
          // The dropdown sits inside the screen's own (outer) FlatList, so
          // without this, Android's nested-scroll gesture arbitration was
          // handing drags to the outer list instead of this one — the inner
          // list looked "stuck" at whatever first page fit, silently
          // clipping the rest of the results behind the rounded corners
          // instead of letting you scroll to them.
          nestedScrollEnabled
          showsVerticalScrollIndicator
          renderItem={({ item }) => (
            <Pressable style={styles.row} onPress={() => onSelect(item)}>
              <Text style={styles.label} numberOfLines={1}>
                {getLabel(item)}
              </Text>
              {getSublabel && (
                <Text style={styles.sublabel} numberOfLines={1}>
                  {getSublabel(item)}
                </Text>
              )}
            </Pressable>
          )}
        />
      </View>
    </>
  );
}

// Self-contained input + dropdown for containers that don't need to clip
// their own bounds (e.g. a plain View search bar). Screens whose search
// pill uses `overflow: "hidden"` (for BlurView corner clipping) should
// instead compose `useAutocomplete` + a plain TextInput + `SuggestionsDropdown`
// directly, so the dropdown can render outside the clipped pill.
export default function SearchAutocomplete({
  value,
  onChange,
  items,
  searchKeys,
  getLabel,
  getSublabel,
  getKey,
  onSelect,
  placeholder,
  inputRef,
  maxSuggestions = 6,
  topOffset = 58,
  inputStyle,
  containerStyle,
  onOpenChange,
}) {
  const { open, setOpen, suggestions } = useAutocomplete({
    items,
    searchKeys,
    value,
    maxSuggestions,
  });

  const dropdownVisible = open && suggestions.length > 0;
  useEffect(() => {
    onOpenChange?.(dropdownVisible);
  }, [dropdownVisible, onOpenChange]);

  const selectItem = (item) => {
    setOpen(false);
    onSelect(item);
  };

  return (
    <View style={[styles.wrap, containerStyle]}>
      <TextInput
        ref={inputRef}
        value={value}
        onChangeText={(text) => {
          onChange(text);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        placeholder={placeholder}
        placeholderTextColor={colors.steel}
        autoCapitalize="none"
        autoCorrect={false}
        style={[styles.input, inputStyle]}
      />

      <SuggestionsDropdown
        visible={open}
        suggestions={suggestions}
        getLabel={getLabel}
        getSublabel={getSublabel}
        getKey={getKey}
        onSelect={selectItem}
        onDismiss={() => setOpen(false)}
        topOffset={topOffset}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1 },
  hidden: { opacity: 0 },
  backdrop: {
    position: "absolute",
    left: 0,
    right: 0,
    zIndex: 40,
    elevation: 11,
  },
  input: {
    flex: 1,
    color: colors.chrome,
    fontSize: 14.5,
    outlineStyle: "none",
  },
  dropdown: {
    position: "absolute",
    left: 0,
    right: 0,
    maxHeight: 320,
    backgroundColor: colors.onyxRaised,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.hairline,
    overflow: "hidden",
    zIndex: 50,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  dropdownList: {
    maxHeight: 320,
  },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.hairline,
  },
  label: { color: colors.chrome, fontSize: 14, fontWeight: "600" },
  sublabel: { color: colors.steel, fontSize: 12, marginTop: 2 },
});

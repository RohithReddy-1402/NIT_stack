import Avatar from "@/components/forum/Avatar";
import PostCard from "@/components/forum/PostCard";
import { EmptyState } from "@/components/forum/States";
import { useAuth } from "@/contexts/AuthContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useInfiniteList } from "@/hooks/forum/useInfiniteList";
import { search, suggest } from "@/services/forum";
import { seedPosts } from "@/services/forumStore";
import { compactNumber } from "@/utils/forumFormat";
import { router } from "expo-router";
import { ChevronLeft, Search as SearchIcon, X } from "lucide-react-native";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TYPES = [
  { value: "posts", label: "Posts" },
  { value: "communities", label: "Communities" },
  { value: "users", label: "People" },
];
const POST_SORTS = [
  { value: "relevance", label: "Relevant" },
  { value: "new", label: "New" },
  { value: "top", label: "Top" },
];

// The API wraps matched words in \u0002…\u0003 (characters users can't type).
function Snippet({ text, style, boldStyle }) {
  const parts = text.split(/(\u0002[^\u0003]*\u0003)/);
  return (
    <Text style={style} numberOfLines={3}>
      {parts.map((p, i) =>
        p.startsWith("\u0002") ? <Text key={i} style={boldStyle}>{p.slice(1, -1)}</Text> : p,
      )}
    </Text>
  );
}

export default function ForumSearch() {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { token } = useAuth();

  const [text, setText] = useState("");
  const [query, setQuery] = useState(""); // submitted query
  const [type, setType] = useState("posts");
  const [sort, setSort] = useState("relevance");
  const [suggestions, setSuggestions] = useState(null);

  // Typeahead while typing (before submit).
  const typed = text.trim();
  useEffect(() => {
    if (!typed || typed === query) return undefined;
    const controller = new AbortController();
    const timer = setTimeout(() => {
      suggest(token, typed, controller.signal).then(setSuggestions).catch(() => {});
    }, 250);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [typed, query, token]);

  const minLength = type === "posts" ? 2 : 1;
  const results = useInfiniteList(
    (cursor) => search(token, { q: query, type, sort: type === "posts" ? sort : undefined, cursor }),
    `${query}|${type}|${sort}|${token ?? ""}`,
    {
      enabled: query.length >= minLength,
      onPage: (items) => type === "posts" && seedPosts(items),
    },
  );

  const submit = () => {
    if (typed.length < 1) return;
    setQuery(typed);
    setSuggestions(null);
  };

  const showSuggestions = typed && typed !== query && suggestions && (suggestions.communities.length || suggestions.users.length);

  const header = query ? (
    <View style={styles.filters}>
      <View style={styles.row}>
        {TYPES.map((t) => (
          <TouchableOpacity key={t.value} style={[styles.chip, type === t.value && styles.chipOn]} onPress={() => setType(t.value)}>
            <Text style={[styles.chipText, type === t.value && styles.chipTextOn]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {type === "posts" ? (
        <View style={styles.row}>
          {POST_SORTS.map((s) => (
            <TouchableOpacity key={s.value} onPress={() => setSort(s.value)}>
              <Text style={[styles.sort, sort === s.value && styles.sortOn]}>{s.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      ) : null}
      {type === "posts" && results.extra.fuzzy ? (
        <Text style={styles.note}>No exact matches — showing posts with similar titles.</Text>
      ) : null}
    </View>
  ) : null;

  const renderItem = ({ item }) => {
    if (type === "communities") {
      return (
        <TouchableOpacity style={styles.hit} onPress={() => router.push(`/forum/c/${item.name}`)}>
          <Avatar name={item.name} url={item.iconUrl} size={38} square />
          <View style={{ flex: 1 }}>
            <Text style={styles.hitTitle}>c/{item.name}</Text>
            <Text style={styles.hitMeta} numberOfLines={1}>{item.title} · {compactNumber(item.memberCount)} members</Text>
          </View>
        </TouchableOpacity>
      );
    }
    if (type === "users") {
      return (
        <TouchableOpacity style={styles.hit} onPress={() => router.push(`/forum/u/${item.handle}`)}>
          <Avatar name={item.handle} url={item.avatarUrl} size={38} />
          <View style={{ flex: 1 }}>
            <Text style={styles.hitTitle}>u/{item.handle}</Text>
            <Text style={styles.hitMeta}>{compactNumber(item.karma)} karma</Text>
          </View>
        </TouchableOpacity>
      );
    }
    return (
      <View>
        <PostCard post={item} />
        {/* Only when the match is in the body (title matches are already visible). */}
        {item.snippet?.includes("\u0002") ? (
          <Snippet text={item.snippet} style={styles.snippet} boldStyle={styles.snippetBold} />
        ) : null}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <View style={styles.bar}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={8} accessibilityLabel="Back">
          <ChevronLeft size={24} color={colors.chrome} />
        </TouchableOpacity>
        <View style={styles.inputWrap}>
          <SearchIcon size={17} color={colors.steel} />
          <TextInput
            style={styles.input}
            value={text}
            onChangeText={setText}
            onSubmitEditing={submit}
            placeholder="Search posts, c/communities, u/people"
            placeholderTextColor={colors.steel}
            returnKeyType="search"
            autoFocus
            autoCapitalize="none"
          />
          {text ? (
            <TouchableOpacity onPress={() => setText("")} hitSlop={8} accessibilityLabel="Clear">
              <X size={16} color={colors.steel} />
            </TouchableOpacity>
          ) : null}
        </View>
      </View>

      {showSuggestions ? (
        <View style={styles.suggest}>
          {suggestions.communities.map((c) => (
            <TouchableOpacity key={`c-${c.name}`} style={styles.hit} onPress={() => router.push(`/forum/c/${c.name}`)}>
              <Avatar name={c.name} url={c.iconUrl} size={30} square />
              <Text style={styles.hitTitle}>c/{c.name}</Text>
              <Text style={styles.hitMeta}>{compactNumber(c.memberCount)} members</Text>
            </TouchableOpacity>
          ))}
          {suggestions.users.map((u) => (
            <TouchableOpacity key={`u-${u.handle}`} style={styles.hit} onPress={() => router.push(`/forum/u/${u.handle}`)}>
              <Avatar name={u.handle} url={u.avatarUrl} size={30} />
              <Text style={styles.hitTitle}>u/{u.handle}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity style={styles.hit} onPress={submit}>
            <SearchIcon size={18} color={colors.accent} />
            <Text style={[styles.hitTitle, { color: colors.accent }]}>Search for “{typed}”</Text>
          </TouchableOpacity>
        </View>
      ) : !query ? (
        <EmptyState icon={SearchIcon} title="Search the forum" subtitle={'Tip: use "quotes" for exact phrases and -word to exclude.'} />
      ) : query.length < minLength ? (
        <EmptyState title="Type at least 2 characters" />
      ) : (
        <FlatList
          data={results.items}
          keyExtractor={(x) => x.id ?? x.name ?? x.handle}
          renderItem={renderItem}
          ListHeaderComponent={header}
          ListEmptyComponent={
            results.loading ? (
              <ActivityIndicator color={colors.chrome} style={{ marginTop: 30 }} />
            ) : results.failed ? (
              <EmptyState title="Search failed" subtitle={results.error?.message} actionLabel="Retry" onAction={results.reload} />
            ) : (
              <EmptyState icon={SearchIcon} title={`No results for “${query}”`} subtitle="Try different words or another tab." />
            )
          }
          ListFooterComponent={results.loadingMore ? <ActivityIndicator color={colors.chrome} style={{ marginVertical: 16 }} /> : null}
          onEndReached={results.loadMore}
          onEndReachedThreshold={0.5}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={styles.content}
        />
      )}
    </SafeAreaView>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    bar: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 12, paddingVertical: 8 },
    inputWrap: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      gap: 8,
      height: 42,
      paddingHorizontal: 12,
      borderRadius: 21,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
    },
    input: { flex: 1, color: colors.chrome, fontSize: 15 },
    content: { paddingHorizontal: 16, paddingBottom: 140 },
    filters: { gap: 10, paddingVertical: 10 },
    row: { flexDirection: "row", gap: 8, alignItems: "center" },
    chip: { height: 32, paddingHorizontal: 14, borderRadius: 16, borderWidth: 1, borderColor: colors.hairline, justifyContent: "center" },
    chipOn: { backgroundColor: colors.chrome, borderColor: colors.chrome },
    chipText: { color: colors.silver, fontWeight: "600", fontSize: 13 },
    chipTextOn: { color: colors.void },
    sort: { color: colors.steel, fontSize: 13, fontWeight: "600", marginRight: 10 },
    sortOn: { color: colors.chrome },
    note: { color: colors.accent, fontSize: 12.5 },
    suggest: { paddingHorizontal: 16 },
    hit: {
      flexDirection: "row",
      alignItems: "center",
      gap: 12,
      paddingVertical: 11,
      borderBottomWidth: 1,
      borderBottomColor: colors.hairline,
    },
    hitTitle: { color: colors.chrome, fontSize: 15, fontWeight: "600" },
    hitMeta: { color: colors.steel, fontSize: 12.5 },
    snippet: { color: colors.steel, fontSize: 13, marginTop: -4, marginBottom: 12, paddingHorizontal: 6, lineHeight: 18 },
    snippetBold: { color: colors.chrome, fontWeight: "700" },
  });

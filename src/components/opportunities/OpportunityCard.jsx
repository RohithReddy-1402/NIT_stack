import DeadlineBadge from "@/components/opportunities/DeadlineBadge";
import VerifiedBadge from "@/components/opportunities/VerifiedBadge";
import { opportunityTypeLabel } from "@/constants/opportunities";
import { useTheme } from "@/contexts/ThemeContext";
import { useOpportunityActions } from "@/hooks/opportunities/useOpportunityActions";
import { formatCompensation } from "@/utils/deadline";
import { router } from "expo-router";
import { Bookmark, BookmarkCheck, MapPin, Share2 } from "lucide-react-native";
import { memo, useMemo } from "react";
import { Image, Pressable, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export const opportunityHref = (opportunity) => `/opportunities/${opportunity.slug}`;

/** Feed list item — company/type/title/location/compensation/deadline, plus bookmark and share. */
function OpportunityCard({ opportunity }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { toggleSave, share, bookmarked, elements } = useOpportunityActions(opportunity);
  const compensation = formatCompensation(opportunity.compensation ?? {});

  const open = () => router.push(opportunityHref(opportunity));

  return (
    <Pressable onPress={open} style={({ pressed }) => [styles.card, pressed && styles.pressed]}>
      <View style={styles.header}>
        <View style={styles.logoBox}>
          {opportunity.company?.logoUrl ? (
            <Image source={{ uri: opportunity.company.logoUrl }} style={styles.logo} />
          ) : (
            <Text style={styles.logoFallback}>{(opportunity.company?.name || "?").charAt(0).toUpperCase()}</Text>
          )}
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.company} numberOfLines={1}>{opportunity.company?.name}</Text>
          <View style={styles.badgeRow}>
            <Text style={styles.typeBadge}>{opportunityTypeLabel(opportunity.type)}</Text>
            {opportunity.verification?.status === "verified" ? <VerifiedBadge compact /> : null}
            {opportunity.featured ? <Text style={styles.featuredBadge}>Featured</Text> : null}
          </View>
        </View>
        <TouchableOpacity onPress={toggleSave} hitSlop={10} accessibilityLabel="Save opportunity">
          {bookmarked ? <BookmarkCheck size={20} color={colors.accent} /> : <Bookmark size={20} color={colors.steel} />}
        </TouchableOpacity>
      </View>

      <Text style={styles.title} numberOfLines={2}>{opportunity.title}</Text>

      <View style={styles.metaRow}>
        {opportunity.location?.text ? (
          <View style={styles.metaItem}>
            <MapPin size={13} color={colors.steel} />
            <Text style={styles.metaText} numberOfLines={1}>{opportunity.location.text}</Text>
          </View>
        ) : null}
        {compensation ? <Text style={styles.compensation}>{compensation}</Text> : null}
      </View>

      <View style={styles.footer}>
        <DeadlineBadge deadline={opportunity.applicationDeadline} status={opportunity.status} />
        <TouchableOpacity style={styles.chip} onPress={share} accessibilityLabel="Share">
          <Share2 size={15} color={colors.silver} strokeWidth={1.8} />
          <Text style={styles.chipText}>Share</Text>
        </TouchableOpacity>
      </View>
      {elements}
    </Pressable>
  );
}

export default memo(OpportunityCard);

const getStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.onyxRaised,
      borderRadius: 18,
      borderWidth: 1,
      borderColor: colors.hairline,
      padding: 14,
      marginBottom: 10,
    },
    pressed: { opacity: 0.85 },
    header: { flexDirection: "row", alignItems: "center", gap: 10 },
    logoBox: {
      width: 40,
      height: 40,
      borderRadius: 10,
      backgroundColor: colors.onyx,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    logo: { width: "100%", height: "100%" },
    logoFallback: { color: colors.chrome, fontWeight: "800", fontSize: 16 },
    company: { color: colors.chrome, fontSize: 13.5, fontWeight: "700" },
    badgeRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 3 },
    typeBadge: { color: colors.steel, fontSize: 11, fontWeight: "600" },
    featuredBadge: { color: colors.accent, fontSize: 11, fontWeight: "700" },
    title: { color: colors.chrome, fontSize: 16.5, fontWeight: "700", lineHeight: 22, marginTop: 10 },
    metaRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8, gap: 8 },
    metaItem: { flexDirection: "row", alignItems: "center", gap: 4, flexShrink: 1 },
    metaText: { color: colors.steel, fontSize: 12.5, flexShrink: 1 },
    compensation: { color: colors.success, fontSize: 13, fontWeight: "700" },
    footer: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 12 },
    chip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 6,
      height: 28,
      paddingHorizontal: 11,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: colors.hairline,
      backgroundColor: colors.glassFill,
    },
    chipText: { color: colors.silver, fontSize: 12.5, fontWeight: "600" },
  });

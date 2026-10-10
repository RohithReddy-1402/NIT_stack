import ForumTopBar from "@/components/forum/ForumTopBar";
import { EmptyState } from "@/components/forum/States";
import RichTextViewer from "@/components/forum/RichTextViewer";
import ApplicationStatusSheet from "@/components/opportunities/ApplicationStatusSheet";
import DeadlineBadge from "@/components/opportunities/DeadlineBadge";
import OpportunityCard from "@/components/opportunities/OpportunityCard";
import VerifiedBadge from "@/components/opportunities/VerifiedBadge";
import { APPLICATION_STATUS_LABELS, opportunityTypeLabel, WORK_MODES } from "@/constants/opportunities";
import { useTheme } from "@/contexts/ThemeContext";
import { useOpportunity } from "@/hooks/opportunities/useOpportunity";
import { useOpportunityActions } from "@/hooks/opportunities/useOpportunityActions";
import { useOpportunityGate } from "@/hooks/opportunities/useOpportunityGate";
import { useMyApplications } from "@/hooks/opportunities/useMyApplications";
import { useOpportunityState } from "@/services/opportunityStore";
import { formatCompensation } from "@/utils/deadline";
import { useLocalSearchParams } from "expo-router";
import Head from "expo-router/head";
import { Bell, BellRing, Bookmark, BookmarkCheck, Building2, Ellipsis, ExternalLink, MapPin, ShieldAlert } from "lucide-react-native";
import { useMemo, useState } from "react";
import { ActivityIndicator, FlatList, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const workModeLabel = (mode) => WORK_MODES.find((m) => m.value === mode)?.label ?? mode;

export default function OpportunityDetailScreen() {
  const { slug } = useLocalSearchParams();
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  const { opportunity, related, loading, error, reload } = useOpportunity(slug);
  const { ensureAuth } = useOpportunityGate();
  const [statusSheetOpen, setStatusSheetOpen] = useState(false);

  const live = useOpportunityState(opportunity);
  const actions = useOpportunityActions(opportunity);
  const { setStatus } = useMyApplications();

  if (loading) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ForumTopBar title="Opportunity" />
        <ActivityIndicator color={colors.chrome} style={{ marginTop: 40 }} />
      </SafeAreaView>
    );
  }

  if (error || !opportunity) {
    return (
      <SafeAreaView style={styles.screen} edges={["top"]}>
        <ForumTopBar title="Opportunity" />
        <EmptyState title="Couldn't load this opportunity" subtitle={error?.message} actionLabel="Retry" onAction={reload} />
      </SafeAreaView>
    );
  }

  const compensation = formatCompensation(opportunity.compensation ?? {});
  const eligibility = opportunity.eligibility ?? {};
  const applyDisabled = !opportunity.links?.applicationUrl;

  const setApplicationStatus = async (status) => {
    if (!ensureAuth()) return;
    setStatusSheetOpen(false);
    try {
      await setStatus(opportunity.id, status);
    } catch {
      // useMyApplications' handleError already surfaced a toast.
    }
  };

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <Head>
        <title>{opportunity.title} — {opportunity.company?.name}</title>
        <meta name="description" content={opportunity.shortDescription || opportunity.description?.slice(0, 150)} />
      </Head>
      <ForumTopBar
        title={opportunity.company?.name}
        subtitle={opportunityTypeLabel(opportunity.type)}
        right={
          <>
            <TouchableOpacity onPress={actions.openReport} hitSlop={8} accessibilityLabel="Report">
              <ShieldAlert size={19} color={colors.steel} strokeWidth={1.8} />
            </TouchableOpacity>
            <TouchableOpacity onPress={actions.openMoreMenu} hitSlop={8} accessibilityLabel="More">
              <Ellipsis size={19} color={colors.steel} strokeWidth={1.8} />
            </TouchableOpacity>
          </>
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headRow}>
          <View style={styles.logoBox}>
            {opportunity.company?.logoUrl ? (
              <View style={styles.logo} />
            ) : (
              <Building2 size={22} color={colors.chrome} strokeWidth={1.75} />
            )}
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.badgeRow}>
              <Text style={styles.typeBadge}>{opportunityTypeLabel(opportunity.type)}</Text>
              {opportunity.verification?.status === "verified" ? <VerifiedBadge /> : null}
              {opportunity.urgent ? <Text style={styles.urgentBadge}>Urgent</Text> : null}
            </View>
          </View>
        </View>

        <Text style={styles.title}>{opportunity.title}</Text>
        <Text style={styles.company}>{opportunity.company?.name}</Text>

        <View style={styles.factsGrid}>
          {opportunity.location?.text ? (
            <View style={styles.factItem}>
              <MapPin size={14} color={colors.steel} />
              <Text style={styles.factText}>{opportunity.location.text} · {workModeLabel(opportunity.location.mode)}</Text>
            </View>
          ) : null}
          {compensation ? <Text style={styles.factHighlight}>{compensation}</Text> : null}
          {opportunity.duration ? <Text style={styles.factText}>Duration: {opportunity.duration}</Text> : null}
          {opportunity.openings ? <Text style={styles.factText}>{opportunity.openings} opening{opportunity.openings === 1 ? "" : "s"}</Text> : null}
        </View>

        <View style={styles.deadlineRow}>
          <DeadlineBadge deadline={opportunity.applicationDeadline} status={opportunity.status} />
          {opportunity.applicationStartDate ? (
            <Text style={styles.deadlineMeta}>Opens {new Date(opportunity.applicationStartDate).toLocaleDateString()}</Text>
          ) : null}
        </View>

        {opportunity.shortDescription ? <Text style={styles.summary}>{opportunity.shortDescription}</Text> : null}

        <Section title="Eligibility">
          {eligibility.branches?.length ? <Fact label="Branches" value={eligibility.branches.join(", ")} colors={colors} /> : null}
          {eligibility.batches?.length ? <Fact label="Batch" value={eligibility.batches.join(", ")} colors={colors} /> : null}
          {eligibility.semesters?.length ? <Fact label="Semester" value={eligibility.semesters.join(", ")} colors={colors} /> : null}
          {eligibility.minCgpa ? <Fact label="Minimum CGPA" value={String(eligibility.minCgpa)} colors={colors} /> : null}
          {eligibility.backlogsAllowed !== undefined ? (
            <Fact label="Backlogs" value={eligibility.backlogsAllowed ? "Allowed" : "Not allowed"} colors={colors} />
          ) : null}
          {eligibility.criteria ? <Text style={styles.paragraph}>{eligibility.criteria}</Text> : null}
        </Section>

        {opportunity.skills?.required?.length || opportunity.skills?.preferred?.length ? (
          <Section title="Skills">
            {opportunity.skills?.required?.length ? <ChipList label="Required" values={opportunity.skills.required} colors={colors} /> : null}
            {opportunity.skills?.preferred?.length ? <ChipList label="Preferred" values={opportunity.skills.preferred} colors={colors} /> : null}
          </Section>
        ) : null}

        {opportunity.description ? (
          <Section title="Description">
            <RichTextViewer html={opportunity.description} />
          </Section>
        ) : null}

        {opportunity.selectionProcess ? (
          <Section title="Selection process">
            <Text style={styles.paragraph}>{opportunity.selectionProcess}</Text>
          </Section>
        ) : null}

        {opportunity.instructions ? (
          <Section title="Important instructions">
            <Text style={styles.paragraph}>{opportunity.instructions}</Text>
          </Section>
        ) : null}

        {opportunity.contact ? (
          <Section title="Contact">
            <Text style={styles.paragraph}>{opportunity.contact}</Text>
          </Section>
        ) : null}

        <Section title="Source">
          <Text style={styles.paragraph}>
            Posted {new Date(opportunity.datePosted).toLocaleDateString()}
            {opportunity.lastUpdated ? ` · Updated ${new Date(opportunity.lastUpdated).toLocaleDateString()}` : ""}
          </Text>
          {opportunity.links?.sourceUrl ? <Text style={styles.link}>{opportunity.links.sourceUrl}</Text> : null}
        </Section>

        {related?.length ? (
          <View style={{ marginTop: 8 }}>
            <Text style={styles.sectionTitle}>Related opportunities</Text>
            <FlatList
              data={related}
              keyExtractor={(o) => o.id}
              renderItem={({ item }) => (
                <View style={{ width: 280, marginRight: 10 }}>
                  <OpportunityCard opportunity={item} />
                </View>
              )}
              horizontal
              showsHorizontalScrollIndicator={false}
            />
          </View>
        ) : null}

        <TouchableOpacity style={styles.trackerRow} onPress={() => ensureAuth() && setStatusSheetOpen(true)}>
          <Text style={styles.trackerLabel}>My application status</Text>
          <Text style={styles.trackerValue}>{live.applicationStatus ? APPLICATION_STATUS_LABELS[live.applicationStatus] : "Not tracked"}</Text>
        </TouchableOpacity>
        <Text style={styles.help}>Optional — tracking your own progress here never affects the real application.</Text>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity onPress={actions.toggleSave} style={styles.iconBtn} accessibilityLabel="Save">
          {actions.bookmarked ? <BookmarkCheck size={20} color={colors.accent} /> : <Bookmark size={20} color={colors.chrome} />}
        </TouchableOpacity>
        <TouchableOpacity onPress={actions.openReminderPicker} style={styles.iconBtn} accessibilityLabel="Remind me">
          {live.reminderLeadHours ? <BellRing size={20} color={colors.accent} /> : <Bell size={20} color={colors.chrome} />}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.applyBtn, applyDisabled && styles.applyBtnDisabled]}
          disabled={applyDisabled}
          onPress={actions.applyOfficial}
        >
          <ExternalLink size={16} color={colors.void} strokeWidth={2.2} />
          <Text style={styles.applyText}>Apply on Official Website</Text>
        </TouchableOpacity>
      </View>

      <ApplicationStatusSheet visible={statusSheetOpen} onSelect={setApplicationStatus} onClose={() => setStatusSheetOpen(false)} />
      {actions.elements}
    </SafeAreaView>
  );
}

function Section({ title, children }) {
  const { colors } = useTheme();
  const styles = useMemo(() => getStyles(colors), [colors]);
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Fact({ label, value, colors }) {
  return (
    <View style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
      <Text style={{ color: colors.steel, fontSize: 13 }}>{label}</Text>
      <Text style={{ color: colors.silver, fontSize: 13, fontWeight: "600" }}>{value}</Text>
    </View>
  );
}

function ChipList({ label, values, colors }) {
  return (
    <View style={{ marginBottom: 8 }}>
      <Text style={{ color: colors.steel, fontSize: 12, marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
        {values.map((v) => (
          <Text
            key={v}
            style={{
              color: colors.chrome,
              fontSize: 12,
              borderWidth: 1,
              borderColor: colors.hairline,
              borderRadius: 8,
              paddingHorizontal: 8,
              paddingVertical: 4,
              overflow: "hidden",
            }}
          >
            {v}
          </Text>
        ))}
      </View>
    </View>
  );
}

const getStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.void },
    // Clears the floating footer (~74px) sitting above the floating
    // LiquidGlassTabBar (~88px) — see `footer` below.
    content: { padding: 16, paddingBottom: 190 },
    headRow: { flexDirection: "row", alignItems: "center", gap: 10 },
    logoBox: {
      width: 48,
      height: 48,
      borderRadius: 12,
      backgroundColor: colors.onyxRaised,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: "center",
      justifyContent: "center",
    },
    logo: { width: "100%", height: "100%", borderRadius: 12 },
    badgeRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    typeBadge: { color: colors.steel, fontSize: 12, fontWeight: "700" },
    urgentBadge: { color: colors.danger, fontSize: 12, fontWeight: "700" },
    title: { color: colors.chrome, fontSize: 22, fontWeight: "800", marginTop: 14, lineHeight: 28 },
    company: { color: colors.silver, fontSize: 14.5, fontWeight: "600", marginTop: 4 },
    factsGrid: { marginTop: 14, gap: 6 },
    factItem: { flexDirection: "row", alignItems: "center", gap: 6 },
    factText: { color: colors.silver, fontSize: 13 },
    factHighlight: { color: colors.success, fontSize: 15, fontWeight: "800" },
    deadlineRow: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 12 },
    deadlineMeta: { color: colors.steel, fontSize: 12 },
    summary: { color: colors.silver, fontSize: 14.5, lineHeight: 21, marginTop: 14 },
    section: { marginTop: 22 },
    sectionTitle: { color: colors.chrome, fontSize: 15, fontWeight: "700", marginBottom: 10 },
    paragraph: { color: colors.silver, fontSize: 14, lineHeight: 20 },
    link: { color: colors.accent, fontSize: 13, marginTop: 4 },
    trackerRow: {
      marginTop: 24,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      backgroundColor: colors.onyxRaised,
      borderWidth: 1,
      borderColor: colors.hairline,
      borderRadius: 14,
      padding: 14,
    },
    trackerLabel: { color: colors.chrome, fontSize: 13.5, fontWeight: "700" },
    trackerValue: { color: colors.accent, fontSize: 13.5, fontWeight: "700" },
    help: { color: colors.steel, fontSize: 11.5, marginTop: 8 },
    // Floating, not in-flow: the app's bottom tab bar is a global overlay
    // (position: absolute, bottom: 0, height: 72, zIndex: 100 — see
    // NavTab.tsx), so an in-flow footer would sit directly underneath it,
    // partly hidden and untappable. bottom: 88 clears the tab bar with a
    // small gap; zIndex: 101 keeps this footer tappable above it.
    footer: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 88,
      zIndex: 101,
      flexDirection: "row",
      alignItems: "center",
      gap: 10,
      padding: 14,
      borderTopWidth: 1,
      borderTopColor: colors.hairline,
      backgroundColor: colors.void,
    },
    iconBtn: {
      width: 46,
      height: 46,
      borderRadius: 14,
      borderWidth: 1,
      borderColor: colors.hairline,
      alignItems: "center",
      justifyContent: "center",
    },
    applyBtn: {
      flex: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: 8,
      height: 46,
      borderRadius: 14,
      backgroundColor: colors.chrome,
    },
    applyBtnDisabled: { opacity: 0.4 },
    applyText: { color: colors.void, fontWeight: "700", fontSize: 14.5 },
  });

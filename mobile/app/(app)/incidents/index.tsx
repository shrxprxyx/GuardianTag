import { useMemo, useState } from "react";
import { View, Text, TextInput, Pressable } from "react-native";
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { useApi } from "@/hooks/useApi";
import { ScreenContainer } from "@/components/ui/ScreenContainer";
import { ScreenHeader } from "@/components/ui/ScreenHeader";
import { Card } from "@/components/ui/Card";
import { Badge, type BadgeTone } from "@/components/ui/Badge";
import { LoadingState, ErrorState, EmptyState } from "@/components/ui/StateViews";
import { colors } from "@/constants/theme";
import type { Incident, IncidentStatus } from "@/types/api";

type FilterKey = "all" | IncidentStatus;

const FILTERS: { key: FilterKey; label: string }[] = [
    { key: "all", label: "All" },
    { key: "open", label: "Open" },
    { key: "investigating", label: "Investigating" },
    { key: "resolved", label: "Resolved" },
    { key: "false_alarm", label: "False alarm" },
];

const statusTone: Record<IncidentStatus, BadgeTone> = {
    open: "emergency",
    investigating: "warning",
    resolved: "safe",
    false_alarm: "muted",
};

const statusLabel: Record<IncidentStatus, string> = {
    open: "Open",
    investigating: "Investigating",
    resolved: "Resolved",
    false_alarm: "False alarm",
};

const severityTone: Record<Incident["severity"], BadgeTone> = {
    low: "muted",
    medium: "warning",
    high: "emergency",
    critical: "emergency",
};

export default function IncidentsList() {
    const api = useApi();
    const [filter, setFilter] = useState<FilterKey>("all");
    const [search, setSearch] = useState("");

    const incidentsQuery = useQuery({
        queryKey: ["incidents"],
        queryFn: () => api.get<Incident[]>("/incidents"),
    });

    const filtered = useMemo(() => {
        const all = incidentsQuery.data ?? [];
        const byStatus = filter === "all" ? all : all.filter((i) => i.status === filter);
        const q = search.trim().toLowerCase();
        if (!q) return byStatus;
        return byStatus.filter(
            (i) => i.title.toLowerCase().includes(q) || (i.description ?? "").toLowerCase().includes(q),
        );
    }, [incidentsQuery.data, filter, search]);

    return (
        <ScreenContainer onRefresh={() => incidentsQuery.refetch()} refreshing={incidentsQuery.isRefetching}>
            <ScreenHeader title="Cases" subtitle="All your cases" />

            <View className="flex-row items-center bg-surface dark:bg-[#15161C] border border-border dark:border-[#26282F] rounded-xl px-3 mb-4">
                <Feather name="search" size={16} color={colors.muted} />
                <TextInput
                    className="flex-1 text-foreground dark:text-white py-3 px-2"
                    placeholder="Search cases"
                    placeholderTextColor="#8B8B9E"
                    value={search}
                    onChangeText={setSearch}
                />
            </View>

            <View className="flex-row flex-wrap gap-2 mb-4">
                {FILTERS.map((f) => {
                    const active = filter === f.key;
                    return (
                        <Pressable
                            key={f.key}
                            onPress={() => setFilter(f.key)}
                            className="px-3.5 py-2 rounded-full"
                            style={{
                                backgroundColor: active ? colors.primary : colors.surfaceAlt,
                                borderWidth: active ? 0 : 1,
                                borderColor: colors.border,
                            }}
                        >
                            <Text
                                className="text-[13px] font-medium"
                                style={{ color: active ? colors.background : colors.mutedLight }}
                            >
                                {f.label}
                            </Text>
                        </Pressable>
                    );
                })}
            </View>

            {incidentsQuery.isLoading ? <LoadingState label="Loading..." /> : null}
            {incidentsQuery.error ? (
                <ErrorState message={(incidentsQuery.error as Error).message} onRetry={() => incidentsQuery.refetch()} />
            ) : null}

            {!incidentsQuery.isLoading && !incidentsQuery.error && filtered.length === 0 ? (
                <EmptyState
                    title="No cases found"
                    message={search ? "Try a different search." : "Nothing to show for this filter."}
                />
            ) : null}

            {filtered.map((incident) => (
                <Card key={incident.id} className="mb-3">
                    <Pressable
                        onPress={() =>
                            router.push({
                                pathname: "/(app)/incidents/[id]",
                                params: {
                                    id: incident.id,
                                },
                            })
                        }
                    >
                        <View className="flex-row items-start justify-between mb-2">
                            <Text className="text-foreground dark:text-white font-semibold text-[15px] flex-1 mr-2">
                                {incident.title}
                            </Text>
                            <Badge label={incident.severity} tone={severityTone[incident.severity]} />
                        </View>
                        {incident.description ? (
                            <Text className="text-muted dark:text-[#8A8D98] text-[13px] mb-2" numberOfLines={2}>
                                {incident.description}
                            </Text>
                        ) : null}
                        <View className="flex-row items-center justify-between mt-1">
                            <Badge label={statusLabel[incident.status]} tone={statusTone[incident.status]} />
                            <Text className="text-muted dark:text-[#8A8D98] text-[12px]">
                                {new Date(incident.triggered_at).toLocaleString()}
                            </Text>
                        </View>
                    </Pressable>
                </Card>
            ))}
        </ScreenContainer>
    );
}
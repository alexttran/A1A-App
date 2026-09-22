import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Switch, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Screen } from '@/components/Screen';
import {
  Banner,
  Button,
  Divider,
  Input,
  ScreenHeader,
  SectionLabel,
  Sheet,
  Text,
} from '@/components/ui';
import { useActions, useData } from '@/lib/mock/store';
import type { EventCategory } from '@/lib/mock/types';
import { categoryPalette, colors, radii, spacing } from '@/theme';

/**
 * Event category management — FR-ADM-5.
 *
 * Categories are data, not code (FR-CAL-6), so renaming Red/Green/Blue to whatever
 * A1A actually calls them does not need an app release. That is the point of this
 * screen, and open question Q4 is answered here rather than in a migration.
 */
export function CategoriesScreen() {
  const db = useData();
  const actions = useActions();

  const [editing, setEditing] = useState<EventCategory | null>(null);
  const [creating, setCreating] = useState(false);
  const [draftName, setDraftName] = useState('');
  const [draftColor, setDraftColor] = useState<string>(categoryPalette[0]);

  const openCreate = () => {
    setDraftName('');
    setDraftColor(categoryPalette[0]);
    setCreating(true);
  };

  const openEdit = (category: EventCategory) => {
    setDraftName(category.name);
    setDraftColor(category.colorHex);
    setEditing(category);
  };

  const usageCount = (categoryId: string) =>
    db.events.filter((e) => e.categoryId === categoryId).length;

  const active = db.eventCategories.filter((c) => c.isActive);
  const retired = db.eventCategories.filter((c) => !c.isActive);

  return (
    <Screen
      scroll={false}
      padded={false}
      header={
        <ScreenHeader
          title="Event categories"
          subtitle={`${active.length} active`}
          showBack
          actions={[{ icon: 'add', label: 'New category', onPress: openCreate }]}
        />
      }
    >
      <ScrollView contentContainerStyle={styles.list}>
        <View style={styles.inset}>
          <Banner
            tone="info"
            body="Categories are stored as data. Renaming or recolouring one updates every event that uses it, with no app release."
          />
        </View>

        <SectionLabel>Active</SectionLabel>
        <View style={styles.card}>
          {active.map((category, index) => (
            <View key={category.id}>
              {index > 0 ? <Divider inset /> : null}
              <CategoryRow
                category={category}
                usage={usageCount(category.id)}
                onEdit={() => openEdit(category)}
                onToggleActive={() => actions.updateCategory(category.id, { isActive: false })}
              />
            </View>
          ))}
        </View>

        {retired.length > 0 ? (
          <>
            <SectionLabel>Retired</SectionLabel>
            <View style={styles.card}>
              {retired.map((category, index) => (
                <View key={category.id}>
                  {index > 0 ? <Divider inset /> : null}
                  <CategoryRow
                    category={category}
                    usage={usageCount(category.id)}
                    onEdit={() => openEdit(category)}
                    onToggleActive={() => actions.updateCategory(category.id, { isActive: true })}
                  />
                </View>
              ))}
            </View>
            <Text variant="caption" tone="subtle" style={styles.foot}>
              Retiring a category keeps every event that already uses it. It just stops appearing as
              a filter option and as a choice on new events.
            </Text>
          </>
        ) : null}
      </ScrollView>

      <Sheet
        visible={creating || editing !== null}
        onClose={() => {
          setCreating(false);
          setEditing(null);
        }}
        title={editing ? 'Edit category' : 'New category'}
      >
        <Input
          label="Name"
          value={draftName}
          onChangeText={setDraftName}
          placeholder="Case coverage"
          maxLength={40}
          showCounter
          required
        />

        <View style={styles.group}>
          <Text variant="label" tone="muted">
            Colour
          </Text>
          <View style={styles.swatches}>
            {categoryPalette.map((hex) => (
              <Pressable
                key={hex}
                onPress={() => setDraftColor(hex)}
                accessibilityRole="button"
                accessibilityLabel={`Colour ${hex}`}
                accessibilityState={{ selected: draftColor === hex }}
                style={[
                  styles.swatch,
                  { backgroundColor: hex },
                  draftColor === hex && styles.swatchSelected,
                ]}
              >
                {draftColor === hex ? (
                  <Ionicons name="checkmark" size={16} color="#FFFFFF" />
                ) : null}
              </Pressable>
            ))}
          </View>
          <Text variant="caption" tone="subtle">
            Colour is never the only signal — every event also shows its category name, so the
            calendar works without relying on colour vision.
          </Text>
        </View>

        <Button
          label={editing ? 'Save category' : 'Add category'}
          onPress={() => {
            if (editing)
              actions.updateCategory(editing.id, { name: draftName.trim(), colorHex: draftColor });
            else actions.addCategory(draftName.trim(), draftColor);
            setCreating(false);
            setEditing(null);
          }}
          disabled={draftName.trim().length === 0}
          fullWidth
          style={styles.spaced}
        />
      </Sheet>
    </Screen>
  );
}

function CategoryRow({
  category,
  usage,
  onEdit,
  onToggleActive,
}: {
  category: EventCategory;
  usage: number;
  onEdit: () => void;
  onToggleActive: () => void;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowSwatch, { backgroundColor: category.colorHex }]} />
      <Pressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`Edit ${category.name}`}
        style={styles.rowCopy}
      >
        <Text variant="bodyStrong">{category.name}</Text>
        <Text variant="caption" tone="subtle">
          {usage === 0 ? 'Not used yet' : `${usage} event${usage === 1 ? '' : 's'}`} ·{' '}
          {category.colorHex}
        </Text>
      </Pressable>
      <Switch
        value={category.isActive}
        onValueChange={onToggleActive}
        accessibilityLabel={`${category.name} active`}
        trackColor={{ true: colors.primary, false: colors.borderStrong }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingBottom: spacing.xxxl },
  inset: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  card: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    minHeight: 56,
  },
  rowSwatch: { width: 18, height: 18, borderRadius: radii.pill },
  rowCopy: { flex: 1, gap: 1, minHeight: 44, justifyContent: 'center' },
  group: { gap: spacing.sm, marginTop: spacing.sm },
  swatches: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: radii.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchSelected: { borderWidth: 3, borderColor: colors.text },
  spaced: { marginTop: spacing.md },
  foot: { paddingHorizontal: spacing.xl, paddingTop: spacing.md, textAlign: 'center' },
});

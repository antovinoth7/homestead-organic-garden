import React, { useMemo } from 'react';
import {
  Pressable,
  Text,
  TouchableOpacity,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useTheme } from '@/theme';
import { createStyles } from '@/styles/carePlanBandStyles';
import type {
  CarePlanBandTone,
  CarePlanOverdueFooter,
  CarePlanSectionHeader,
} from '@/utils/carePlanSections';

type Styles = ReturnType<typeof createStyles>;

/** Catch up and a picked day sit on a tinted panel; the other bands do not. */
const isPanel = (tone: CarePlanBandTone): boolean => tone === 'overdue' || tone === 'picked';

const panelStyle = (styles: Styles, tone: CarePlanBandTone): StyleProp<ViewStyle> =>
  tone === 'overdue' ? styles.bodyOverdue : tone === 'picked' ? styles.bodyPicked : null;

const dotStyle = (styles: Styles, tone: CarePlanBandTone, isNow: boolean): StyleProp<ViewStyle> => {
  switch (tone) {
    case 'picked':
      return styles.dotPicked;
    case 'overdue':
      return styles.dotOverdue;
    case 'later':
      return styles.dotLater;
    case 'done':
      return styles.dotDone;
    default:
      return isNow ? styles.dotNow : null;
  }
};

interface FrameProps {
  tone: CarePlanBandTone;
  /** Header rows carry the dot; footers close the panel. */
  part: 'header' | 'row' | 'footer';
  isNow?: boolean;
  children?: React.ReactNode;
}

/**
 * One list row of a band: the timeline gutter on the left and the band's body.
 * A band spans several SectionList rows (header, cards, footer), so each one
 * paints its slice of the gutter line and of the tinted panel.
 */
export function CarePlanBandFrame({
  tone,
  part,
  isNow = false,
  children,
}: FrameProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const panel = isPanel(tone);

  return (
    <View style={[styles.bandRow, part === 'header' && styles.bandRowFirst]}>
      <View
        style={[
          styles.gutter,
          part === 'header' && (panel ? styles.gutterHeaderPanel : styles.gutterHeader),
        ]}
      >
        {part === 'header' && <View style={[styles.dot, dotStyle(styles, tone, isNow)]} />}
        <View style={[styles.gutterLine, part === 'header' && styles.gutterLineBelowDot]} />
      </View>
      <View
        style={[
          styles.body,
          panel && styles.bodyPanel,
          panelStyle(styles, tone),
          panel && part === 'header' && styles.bodyPanelTop,
          panel && part === 'footer' && styles.bodyPanelBottom,
        ]}
      >
        {children}
      </View>
    </View>
  );
}

interface HeaderProps {
  header: CarePlanSectionHeader;
  /** The select-all box while selecting, else null. */
  selectBox: React.ReactNode;
  /** "6:23" — shown in the NOW chip when the band holds the current time. */
  nowLabel: string;
  onToggle: () => void;
  onAdd: () => void;
  /** Rain banners for the band's plots, rendered by the screen. */
  banners: React.ReactNode;
}

/**
 * A band's head: select-all box, title, NOW chip, + Add, count and chevron,
 * then the one-line subtitle and any rain banners. A folding band toggles
 * from anywhere on its title and subtitle.
 */
export function CarePlanBandHeader({
  header,
  selectBox,
  nowLabel,
  onToggle,
  onAdd,
  banners,
}: HeaderProps): React.JSX.Element {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  const collapsible = header.collapsible === true;
  const countLabel = `${header.count} task${header.count === 1 ? '' : 's'}`;

  const titleRow = (
    <View style={styles.headerRow}>
      {selectBox}
      <Text
        style={[
          styles.title,
          header.tone === 'overdue' && styles.titleOverdue,
          header.tone === 'done' && styles.titleDone,
        ]}
        numberOfLines={1}
        accessibilityRole="header"
      >
        {header.title}
      </Text>
      {header.isNow && (
        <View style={styles.nowChip}>
          <Text style={styles.nowChipText}>{`NOW · ${nowLabel}`}</Text>
        </View>
      )}
      <View style={styles.spacer} />
      {header.addAction && (
        <TouchableOpacity
          style={styles.addPill}
          onPress={onAdd}
          accessibilityRole="button"
          accessibilityLabel={`Create a task for ${header.title}`}
        >
          <Text style={styles.addPillText}>+ Add</Text>
        </TouchableOpacity>
      )}
      {header.count > 0 && <Text style={styles.count}>{header.count}</Text>}
      {collapsible && (
        <Ionicons
          name={header.expanded ? 'chevron-up' : 'chevron-down'}
          size={18}
          color={theme.textSecondary}
        />
      )}
    </View>
  );
  const subtitle = header.subtitle ? <Text style={styles.subtitle}>{header.subtitle}</Text> : null;

  return (
    <CarePlanBandFrame tone={header.tone} part="header" isNow={header.isNow}>
      {collapsible ? (
        <Pressable
          onPress={onToggle}
          accessibilityRole="button"
          accessibilityState={{ expanded: header.expanded === true }}
          accessibilityLabel={`${header.title}, ${countLabel}${
            header.subtitle ? `: ${header.subtitle}` : ''
          }`}
        >
          {titleRow}
          {subtitle}
        </Pressable>
      ) : (
        <>
          {titleRow}
          {subtitle}
        </>
      )}
      {banners}
    </CarePlanBandFrame>
  );
}

interface FooterProps {
  tone: CarePlanBandTone;
  footer: CarePlanOverdueFooter | undefined;
  /** Hide Show all / Select all while a selection is running. */
  selectionMode: boolean;
  onToggle: () => void;
  onSelectAll: () => void;
}

/**
 * Closes a band. Catch up carries "Show all N / Show less" and "Select all N";
 * other panels just round off; plain bands need nothing below their cards.
 */
export function CarePlanBandFooter({
  tone,
  footer,
  selectionMode,
  onToggle,
  onSelectAll,
}: FooterProps): React.JSX.Element | null {
  const theme = useTheme();
  const styles = useMemo(() => createStyles(theme), [theme]);
  if (!isPanel(tone)) return null;

  return (
    <CarePlanBandFrame tone={tone} part="footer">
      {footer && !selectionMode && (
        <View style={styles.footerActions}>
          <TouchableOpacity
            style={styles.footerButton}
            onPress={onToggle}
            accessibilityRole="button"
            accessibilityState={{ expanded: footer.expanded }}
          >
            <Text style={styles.footerButtonText}>
              {footer.expanded ? 'Show less' : `Show all ${footer.total}`}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.footerButton, styles.footerButtonStrong]}
            onPress={onSelectAll}
            accessibilityRole="button"
            accessibilityLabel={`Select all ${footer.total} overdue tasks`}
          >
            <Text style={[styles.footerButtonText, styles.footerButtonStrongText]}>
              {`Select all ${footer.total}`}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </CarePlanBandFrame>
  );
}

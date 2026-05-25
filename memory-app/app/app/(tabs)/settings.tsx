import React from 'react';
import { View, Text, Switch, ScrollView, TextStyle, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import Button from '../../src/components/Button';
import { colors, fontSize, fontWeight, spacing, radius, shadows } from '../../src/theme';
import { useUserStore } from '../../src/stores/userStore';
import { Language } from '../../src/i18n';

function SettingRow({
  icon, iconBg, label, desc, right,
}: { icon: string; iconBg: string; label: string; desc?: string; right?: React.ReactNode }) {
  return (
    <View style={{
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing[3],
      padding: spacing[4],
      backgroundColor: 'white',
      borderWidth: 2,
      borderColor: colors.border,
      borderRadius: radius.lg,
      marginBottom: spacing[2],
      ...shadows.xs,
    }}>
      <View style={{
        width: 44, height: 44, borderRadius: radius.md,
        backgroundColor: iconBg,
        alignItems: 'center', justifyContent: 'center',
      }}>
        <Text style={{ fontSize: 20 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{
          fontSize: fontSize.base,
          fontWeight: fontWeight.extrabold as TextStyle['fontWeight'],
          color: colors.text,
        }}>{label}</Text>
        {desc && (
          <Text style={{ fontSize: fontSize.xs, color: colors.textMuted, marginTop: 2, fontWeight: '500' }}>{desc}</Text>
        )}
      </View>
      {right}
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <Text style={{
      fontSize: fontSize.xs,
      fontWeight: fontWeight.black as TextStyle['fontWeight'],
      color: colors.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 1,
      marginTop: spacing[4],
      marginBottom: spacing[2],
    }}>{title}</Text>
  );
}

function LangSwitch() {
  const language = useUserStore(s => s.language);
  const setLanguage = useUserStore(s => s.setLanguage);
  return (
    <View style={{
      flexDirection: 'row',
      backgroundColor: 'white',
      borderRadius: 9999,
      padding: 3,
      borderWidth: 2, borderColor: colors.border,
    }}>
      {(['he','en'] as Language[]).map(l => {
        const active = language === l;
        return (
          <Pressable
            key={l}
            onPress={() => setLanguage(l)}
            style={{
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 9999,
              backgroundColor: active ? colors.primary : 'transparent',
            }}>
            <Text style={{
              fontSize: fontSize.xs,
              fontWeight: fontWeight.black as TextStyle['fontWeight'],
              color: active ? 'white' : colors.textMuted,
            }}>{l === 'he' ? 'עב' : 'EN'}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export default function SettingsScreen() {
  const { t } = useTranslation();
  const darkMode = useUserStore(s => s.darkMode);
  const setDarkMode = useUserStore(s => s.setDarkMode);
  const sound = useUserStore(s => s.soundEnabled);
  const setSound = useUserStore(s => s.setSoundEnabled);
  const notif = useUserStore(s => s.notificationsEnabled);
  const setNotif = useUserStore(s => s.setNotifications);
  const reset = useUserStore(s => s.resetUser);

  return (
    <SafeAreaView edges={['top']} style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ padding: spacing[4], alignItems: 'center' }}>
        <Text style={{
          fontSize: fontSize.lg,
          fontWeight: fontWeight.black as TextStyle['fontWeight'],
          color: colors.text,
        }}>{t('settings.title')}</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: spacing[5] }}>
        <SectionTitle title={`🌐 ${t('settings.language')}`} />
        <SettingRow
          icon="🌐" iconBg={colors.primary}
          label={t('settings.language')}
          desc={t('settings.language_desc')}
          right={<LangSwitch />}
        />

        <SectionTitle title="🎨 Theme" />
        <SettingRow
          icon="🌙" iconBg={colors.primary}
          label={t('settings.dark_mode')}
          desc={t('settings.dark_mode_desc')}
          right={<Switch value={darkMode} onValueChange={setDarkMode} trackColor={{ false: colors.borderStrong, true: colors.success }} />}
        />

        <SectionTitle title="🔔 Sound & alerts" />
        <SettingRow
          icon="🔊" iconBg={colors.streak}
          label={t('settings.sound')}
          desc={t('settings.sound_desc')}
          right={<Switch value={sound} onValueChange={setSound} trackColor={{ false: colors.borderStrong, true: colors.success }} />}
        />
        <SettingRow
          icon="🔔" iconBg={colors.secondary}
          label={t('settings.notifications')}
          desc={t('settings.notifications_desc')}
          right={<Switch value={notif} onValueChange={setNotif} trackColor={{ false: colors.borderStrong, true: colors.success }} />}
        />

        <SectionTitle title={`ℹ️ ${t('settings.about')}`} />
        <SettingRow icon="ℹ️" iconBg={colors.info} label={t('settings.about')} desc={t('settings.version')} />

        <View style={{ marginTop: spacing[6] }}>
          <Button title={t('settings.logout')} variant="ghost" block onPress={reset} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

import React, { useEffect, useState } from 'react';
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from 'src/theme';
import { AppButton, FormInput } from 'src/components/FormElements';
import { KeyboardAvoidingContainer } from 'src/shared/ui';
import { useToast } from 'src/components/Toast';
import {
  useChangePassword,
  useDeleteAccount,
  useLogout,
  useUpdateUser,
  useUser,
} from 'src/hooks/useApi';
import {
  currencies,
  dateFormats,
  DateFormatCode,
  NumberFormatStyle,
  usePreferencesStore,
} from 'src/store/usePreferencesStore';
import { changeAppLanguage, supportedLanguages } from 'src/locales/i18n';
import { hexWithAlpha } from 'src/utils/format';

export const ProfileScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const insets = useSafeAreaInsets();
  const safeBottom =
    insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 48 : 16;
  const { showToast } = useToast();
  const { data: user } = useUser();

  const updateUserMutation = useUpdateUser(() => {
    showToast('Perfil atualizado com sucesso!', 'success');
  });
  const changePasswordMutation = useChangePassword(() => {
    showToast('Senha alterada com sucesso!', 'success');
    setCurrentPassword('');
    setNewPassword('');
    setConfirmNewPassword('');
  });
  const deleteAccountMutation = useDeleteAccount();
  const logoutMutation = useLogout();

  // 1. Personal Info State
  const [name, setName] = useState(user?.name || '');
  const [errName, setErrName] = useState<string | null>(null);

  useEffect(() => {
    if (user?.name) setName(user.name);
  }, [user?.name]);

  // 2. Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [errNewPwd, setErrNewPwd] = useState<string | null>(null);
  const [errConfirmPwd, setErrConfirmPwd] = useState<string | null>(null);

  // 3. Preferences Store
  const {
    currencyCode,
    setCurrency,
    numberFormat,
    setNumberFormat,
    dateFormat,
    setDateFormat,
    notifications,
    setNotifications,
  } = usePreferencesStore();

  // 4. Delete Account Modal State
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleSaveProfile = () => {
    if (!name.trim()) {
      setErrName(t('auth.validation.name_required'));
      return;
    }
    setErrName(null);
    updateUserMutation.mutate({ name: name.trim() });
  };

  const handleSavePassword = () => {
    if (!currentPassword) {
      showToast('A senha atual é obrigatória', 'error');
      return;
    }
    if (!newPassword || newPassword.length < 8) {
      setErrNewPwd(t('auth.validation.password_min_length'));
      return;
    }
    setErrNewPwd(null);

    if (confirmNewPassword !== newPassword) {
      setErrConfirmPwd(t('auth.validation.passwords_mismatch'));
      return;
    }
    setErrConfirmPwd(null);

    changePasswordMutation.mutate(
      { currentPassword, newPassword },
      {
        onError: (err: any) => {
          showToast(
            err?.response?.data?.message || 'Erro ao alterar senha',
            'error'
          );
        },
      }
    );
  };

  const numberOptions: {
    style: NumberFormatStyle;
    labelKey: string;
    example: string;
  }[] = [
    {
      style: 'dot-comma',
      labelKey: 'profile.number_format.dot_comma',
      example: '1.000,00',
    },
    {
      style: 'comma-dot',
      labelKey: 'profile.number_format.comma_dot',
      example: '1,000.00',
    },
  ];

  return (
    <KeyboardAvoidingContainer
      style={[styles.container, { backgroundColor: colors.background.default }]}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingBottom: 24 + safeBottom }]}
        keyboardShouldPersistTaps="handled"
      >
      {/* 1. Personal Info Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.background.paper, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
          {t('profile.personal_info')}
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <FormInput
          label={t('auth.name')}
          value={name}
          onChangeText={setName}
          error={errName}
        />
        <FormInput
          label={t('auth.email')}
          value={user?.email || ''}
          editable={false}
        />

        <AppButton
          title={t('common.save')}
          onPress={handleSaveProfile}
          loading={updateUserMutation.isPending}
        />
      </View>

      {/* 2. Change Password Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.background.paper, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
          {t('profile.change_password')}
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <FormInput
          label="Senha Atual"
          value={currentPassword}
          onChangeText={setCurrentPassword}
          secureTextEntry={!showPwd}
          rightElement={
            <TouchableOpacity onPress={() => setShowPwd(!showPwd)}>
              <MaterialIcons
                name={showPwd ? 'visibility' : 'visibility-off'}
                size={20}
                color={colors.text.secondary}
              />
            </TouchableOpacity>
          }
        />
        <FormInput
          label={t('auth.new_password')}
          value={newPassword}
          onChangeText={setNewPassword}
          secureTextEntry={!showPwd}
          error={errNewPwd}
        />
        <FormInput
          label={t('auth.confirm_new_password')}
          value={confirmNewPassword}
          onChangeText={setConfirmNewPassword}
          secureTextEntry={!showPwd}
          error={errConfirmPwd}
        />

        <AppButton
          title={t('common.save')}
          onPress={handleSavePassword}
          loading={changePasswordMutation.isPending}
        />
      </View>

      {/* 3. Appearance & Notifications Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.background.paper, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
          {t('profile.layout.title')}
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        <View style={styles.switchRow}>
          <View style={styles.switchLabelBox}>
            <MaterialIcons
              name={isDark ? 'dark-mode' : 'light-mode'}
              size={22}
              color={isDark ? colors.primary.main : colors.warning.main}
            />
            <Text style={[styles.switchLabel, { color: colors.text.primary }]}>
              {t('profile.layout.theme')} ({isDark ? t('profile.layout.dark') : t('profile.layout.light')})
            </Text>
          </View>
          <Switch value={isDark} onValueChange={toggleTheme} />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
          {t('profile.notifications.title')}
        </Text>

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.text.primary }]}>
            {t('profile.notifications.enable')}
          </Text>
          <Switch
            value={notifications.enabled}
            onValueChange={() =>
              setNotifications({
                ...notifications,
                enabled: !notifications.enabled,
              })
            }
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.text.primary }]}>
            {t('profile.notifications.email')}
          </Text>
          <Switch
            disabled={!notifications.enabled}
            value={notifications.email}
            onValueChange={() =>
              setNotifications({
                ...notifications,
                email: !notifications.email,
              })
            }
          />
        </View>

        <View style={styles.switchRow}>
          <Text style={[styles.switchLabel, { color: colors.text.primary }]}>
            {t('profile.notifications.push')}
          </Text>
          <Switch
            disabled={!notifications.enabled}
            value={notifications.push}
            onValueChange={() =>
              setNotifications({
                ...notifications,
                push: !notifications.push,
              })
            }
          />
        </View>
      </View>

      {/* 4. Language & Currency Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.background.paper, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
          {t('profile.language.title')}
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        {supportedLanguages.map((lang) => {
          const selected = i18n.language === lang.value;
          return (
            <TouchableOpacity
              key={lang.value}
              onPress={() => changeAppLanguage(lang.value)}
              style={[
                styles.optionRow,
                selected && {
                  backgroundColor: hexWithAlpha(colors.primary.main, 0.12),
                },
              ]}
            >
              <Text style={{ fontSize: 18, marginRight: 10 }}>{lang.flag}</Text>
              <Text
                style={{
                  flex: 1,
                  color: colors.text.primary,
                  fontWeight: selected ? '700' : '500',
                }}
              >
                {lang.label}
              </Text>
              {selected && (
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={colors.primary.main}
                />
              )}
            </TouchableOpacity>
          );
        })}

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
          {t('profile.currency.title')}
        </Text>

        {currencies.map((curr) => {
          const selected = currencyCode === curr.code;
          return (
            <TouchableOpacity
              key={curr.code}
              onPress={() => setCurrency(curr.code)}
              style={[
                styles.optionRow,
                selected && {
                  backgroundColor: hexWithAlpha(colors.primary.main, 0.12),
                },
              ]}
            >
              <Text
                style={{
                  width: 34,
                  fontWeight: '800',
                  color: colors.primary.main,
                }}
              >
                {curr.symbol}
              </Text>
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text.primary,
                    fontWeight: selected ? '700' : '500',
                  }}
                >
                  {curr.label}
                </Text>
                <Text style={{ fontSize: 11, color: colors.text.secondary }}>
                  {curr.code}
                </Text>
              </View>
              {selected && (
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={colors.primary.main}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 5. Number & Date Format Card */}
      <View
        style={[
          styles.card,
          { backgroundColor: colors.background.paper, borderColor: colors.border },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
          {t('profile.number_format.title')}
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />

        {numberOptions.map((opt) => {
          const selected = numberFormat === opt.style;
          return (
            <TouchableOpacity
              key={opt.style}
              onPress={() => setNumberFormat(opt.style)}
              style={[
                styles.optionRow,
                selected && {
                  backgroundColor: hexWithAlpha(colors.primary.main, 0.12),
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text.primary,
                    fontWeight: selected ? '700' : '500',
                  }}
                >
                  {t(opt.labelKey)}
                </Text>
                <Text style={{ fontSize: 12, color: colors.text.secondary }}>
                  {opt.example}
                </Text>
              </View>
              {selected && (
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={colors.primary.main}
                />
              )}
            </TouchableOpacity>
          );
        })}

        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <Text style={[styles.cardTitle, { color: colors.text.primary }]}>
          {t('profile.date_format.title')}
        </Text>

        {dateFormats.map((df) => {
          const selected = dateFormat === df.code;
          return (
            <TouchableOpacity
              key={df.code}
              onPress={() => setDateFormat(df.code as DateFormatCode)}
              style={[
                styles.optionRow,
                selected && {
                  backgroundColor: hexWithAlpha(colors.primary.main, 0.12),
                },
              ]}
            >
              <View style={{ flex: 1 }}>
                <Text
                  style={{
                    color: colors.text.primary,
                    fontWeight: selected ? '700' : '500',
                  }}
                >
                  {t(df.label)}
                </Text>
                <Text style={{ fontSize: 12, color: colors.text.secondary }}>
                  {df.example}
                </Text>
              </View>
              {selected && (
                <MaterialIcons
                  name="check-circle"
                  size={20}
                  color={colors.primary.main}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 6. Logout & Danger Zone (Delete Account) */}
      <AppButton
        title={t('account.logout')}
        variant="outlined"
        color="warning"
        onPress={() => logoutMutation.mutate()}
        loading={logoutMutation.isPending}
      />

      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.background.paper,
            borderColor: hexWithAlpha(colors.error.main, 0.45),
          },
        ]}
      >
        <Text style={[styles.cardTitle, { color: colors.error.main }]}>
          {t('profile.delete_account.title')}
        </Text>
        <View style={[styles.divider, { backgroundColor: colors.divider }]} />
        <Text
          style={{
            color: colors.text.secondary,
            fontSize: 13,
            lineHeight: 19,
            marginBottom: 14,
          }}
        >
          {t('profile.delete_account.warning')}
        </Text>
        <AppButton
          title={t('profile.delete_account.button')}
          color="error"
          onPress={() => setDeleteDialogOpen(true)}
        />
      </View>

      {/* Confirm Account Deletion Modal */}
      <Modal
        visible={deleteDialogOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setDeleteDialogOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.background.paper, borderColor: colors.border },
            ]}
          >
            <Text style={[styles.cardTitle, { color: colors.error.main }]}>
              {t('profile.delete_account.dialog.title')}
            </Text>
            <Text
              style={{
                color: colors.text.secondary,
                fontSize: 13,
                lineHeight: 19,
                marginVertical: 12,
              }}
            >
              {t('profile.delete_account.dialog.description')}
            </Text>
            <View style={{ flexDirection: 'row', gap: 10 }}>
              <AppButton
                title={t('common.cancel')}
                variant="outlined"
                onPress={() => setDeleteDialogOpen(false)}
                style={{ flex: 1 }}
              />
              <AppButton
                title={t('profile.delete_account.dialog.confirm')}
                color="error"
                loading={deleteAccountMutation.isPending}
                onPress={() =>
                  deleteAccountMutation.mutate(undefined, {
                    onError: (err: any) => {
                      showToast(
                        err?.response?.data?.message ||
                          t('profile.delete_account.error'),
                        'error'
                      );
                      setDeleteDialogOpen(false);
                    },
                  })
                }
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
      </ScrollView>
    </KeyboardAvoidingContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
    gap: 16,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    marginVertical: 12,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  switchLabelBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  switchLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 10,
    marginVertical: 2,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 20,
  },
});

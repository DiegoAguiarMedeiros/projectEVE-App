import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from 'src/theme';
import { AppButton, FormInput } from 'src/components/FormElements';
import { KeyboardAvoidingContainer } from 'src/shared/ui';
import {
  useForgotPassword,
  useLogin,
  useRegister,
  useResetPassword,
  useVerifyEmail,
} from 'src/hooks/useApi';
import { changeAppLanguage, supportedLanguages } from 'src/locales/i18n';

// ─── Shared Auth Header ───────────────────────────────────────────────────────

const AuthHeaderBar: React.FC = () => {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const { i18n } = useTranslation();

  const cycleLanguage = () => {
    const idx = supportedLanguages.findIndex((l) => l.value === i18n.language);
    const next = supportedLanguages[(idx + 1) % supportedLanguages.length];
    changeAppLanguage(next.value);
  };

  const currentLang =
    supportedLanguages.find((l) => l.value === i18n.language) || supportedLanguages[0];

  return (
    <View style={styles.authHeader}>
      <View style={styles.brandRow}>
        <View style={[styles.logoBadge, { backgroundColor: colors.primary.main }]}>
          <Text style={styles.logoBadgeText}>EVE</Text>
        </View>
        <Text style={[styles.brandName, { color: colors.text.primary }]}>
          Project EVE
        </Text>
      </View>

      <View style={styles.headerActions}>
        <TouchableOpacity
          onPress={cycleLanguage}
          style={[styles.iconPill, { backgroundColor: colors.background.neutral }]}
        >
          <Text style={{ fontSize: 14 }}>{currentLang.flag}</Text>
          <Text
            style={{
              fontSize: 12,
              fontWeight: '700',
              color: colors.text.primary,
              marginLeft: 4,
            }}
          >
            {currentLang.value.split('-')[0].toUpperCase()}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={toggleTheme}
          style={[styles.iconPill, { backgroundColor: colors.background.neutral }]}
        >
          <MaterialIcons
            name={isDark ? 'light-mode' : 'dark-mode'}
            size={18}
            color={isDark ? colors.warning.main : colors.primary.main}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── 1. Sign In Screen ────────────────────────────────────────────────────────

export const SignInScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { mutate: login, isPending, error } = useLogin();

  const axiosError = error as any;
  const errorKey = axiosError?.response?.data?.message || (error ? 'auth.login_error' : null);

  const handleSignIn = () => {
    login(
      { email: email.trim(), password, locale: i18n.language },
      {
        onError: (err: any) => {
          const msg = err?.response?.data?.message;
          if (msg === 'auth.errors.email_not_verified') {
            navigation.navigate('VerifyEmail', { pending: true });
          }
        },
      }
    );
  };

  return (
    <KeyboardAvoidingContainer
      style={[styles.screen, { backgroundColor: colors.background.default }]}
    >
      <AuthHeaderBar />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.background.paper, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {t('auth.sign_in_title')}
          </Text>

          <FormInput
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={
              errorKey && errorKey !== 'auth.errors.email_not_verified'
                ? t(errorKey)
                : null
            }
          />

          <FormInput
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            rightElement={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity
            onPress={() => navigation.navigate('ForgotPassword')}
            style={{ alignSelf: 'flex-end', marginBottom: 16 }}
          >
            <Text style={{ color: colors.primary.main, fontWeight: '600', fontSize: 13 }}>
              {t('auth.forgot_password')}
            </Text>
          </TouchableOpacity>

          <AppButton
            title={t('auth.sign_in')}
            onPress={handleSignIn}
            loading={isPending}
          />

          <View style={styles.footerRow}>
            <Text style={{ color: colors.text.secondary, fontSize: 14 }}>
              {t('auth.no_account')}{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Registration')}>
              <Text style={{ color: colors.primary.main, fontWeight: '700', fontSize: 14 }}>
                {t('auth.get_started')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingContainer>
  );
};

// ─── 2. Registration Screen ───────────────────────────────────────────────────

export const RegistrationScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errName, setErrName] = useState<string | null>(null);
  const [errEmail, setErrEmail] = useState<string | null>(null);
  const [errConfirmEmail, setErrConfirmEmail] = useState<string | null>(null);
  const [errPassword, setErrPassword] = useState<string | null>(null);
  const [errConfirmPassword, setErrConfirmPassword] = useState<string | null>(null);

  const [successOpen, setSuccessOpen] = useState(false);

  const { mutate: register, isPending } = useRegister(() => {
    setSuccessOpen(true);
  });

  const handleRegister = () => {
    let valid = true;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      setErrName(t('auth.validation.name_required'));
      valid = false;
    } else setErrName(null);

    if (!email.trim()) {
      setErrEmail(t('auth.validation.email_required'));
      valid = false;
    } else if (!emailRegex.test(email.trim())) {
      setErrEmail(t('auth.validation.email_invalid'));
      valid = false;
    } else setErrEmail(null);

    if (confirmEmail.trim() !== email.trim()) {
      setErrConfirmEmail(t('auth.validation.emails_mismatch'));
      valid = false;
    } else setErrConfirmEmail(null);

    if (!password) {
      setErrPassword(t('auth.validation.password_required'));
      valid = false;
    } else if (password.length < 8) {
      setErrPassword(t('auth.validation.password_min_length'));
      valid = false;
    } else setErrPassword(null);

    if (confirmPassword !== password) {
      setErrConfirmPassword(t('auth.validation.passwords_mismatch'));
      valid = false;
    } else setErrConfirmPassword(null);

    if (!valid) return;

    register(
      { name: name.trim(), email: email.trim(), password, locale: i18n.language },
      {
        onError: (err: any) => {
          const msg = err?.response?.data?.message;
          if (msg) setErrEmail(t(msg));
        },
      }
    );
  };

  return (
    <KeyboardAvoidingContainer
      style={[styles.screen, { backgroundColor: colors.background.default }]}
    >
      <AuthHeaderBar />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.background.paper, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.title, { color: colors.text.primary }]}>
            {t('auth.sign_up_title')}
          </Text>

          <FormInput
            label={t('auth.name')}
            value={name}
            onChangeText={setName}
            error={errName}
          />
          <FormInput
            label={t('auth.email')}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errEmail}
          />
          <FormInput
            label={t('auth.confirm_email')}
            value={confirmEmail}
            onChangeText={setConfirmEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            error={errConfirmEmail}
          />
          <FormInput
            label={t('auth.password')}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
            error={errPassword}
            rightElement={
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <MaterialIcons
                  name={showPassword ? 'visibility' : 'visibility-off'}
                  size={20}
                  color={colors.text.secondary}
                />
              </TouchableOpacity>
            }
          />
          <FormInput
            label={t('auth.confirm_password')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry={!showPassword}
            error={errConfirmPassword}
          />

          <AppButton
            title={t('auth.sign_up')}
            onPress={handleRegister}
            loading={isPending}
          />

          <View style={styles.footerRow}>
            <Text style={{ color: colors.text.secondary, fontSize: 14 }}>
              {t('auth.has_account')}{' '}
            </Text>
            <TouchableOpacity onPress={() => navigation.navigate('SignIn')}>
              <Text style={{ color: colors.primary.main, fontWeight: '700', fontSize: 14 }}>
                {t('auth.sign_in')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Registration Success Modal */}
      <Modal visible={successOpen} transparent animationType="fade">
        <View style={styles.modalBackdrop}>
          <View
            style={[
              styles.card,
              { backgroundColor: colors.background.paper, alignItems: 'center' },
            ]}
          >
            <Text style={{ fontSize: 44, marginBottom: 10 }}>🎉</Text>
            <Text style={[styles.title, { color: colors.text.primary, marginBottom: 8 }]}>
              {t('auth.registration_success_title')}
            </Text>
            <Text
              style={{
                color: colors.text.primary,
                textAlign: 'center',
                marginBottom: 8,
              }}
            >
              {t('auth.registration_success_message')}
            </Text>
            <Text
              style={{
                color: colors.text.secondary,
                textAlign: 'center',
                fontSize: 13,
                marginBottom: 20,
              }}
            >
              {t('auth.registration_success_email', { email })}
            </Text>
            <AppButton
              title="OK"
              onPress={() => {
                setSuccessOpen(false);
                navigation.navigate('SignIn');
              }}
              style={{ minWidth: 140 }}
            />
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingContainer>
  );
};

// ─── 3. Forgot Password Screen ────────────────────────────────────────────────

export const ForgotPasswordScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const { colors } = useAppTheme();

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const { mutate: requestReset, isPending } = useForgotPassword(() => {
    setSubmitted(true);
  });

  return (
    <KeyboardAvoidingContainer
      style={[styles.screen, { backgroundColor: colors.background.default }]}
    >
      <AuthHeaderBar />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.background.paper, borderColor: colors.border },
          ]}
        >
          {submitted ? (
            <View style={{ alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 40 }}>📩</Text>
              <Text style={[styles.title, { color: colors.text.primary, marginBottom: 4 }]}>
                {t('auth.forgot_password_success_title')}
              </Text>
              <Text
                style={{
                  color: colors.text.secondary,
                  textAlign: 'center',
                  lineHeight: 20,
                  marginBottom: 12,
                }}
              >
                {t('auth.forgot_password_success_message')}
              </Text>
              <AppButton
                title={t('auth.sign_in')}
                variant="outlined"
                onPress={() => navigation.navigate('SignIn')}
              />
              <AppButton
                title={t('auth.reset_password_title')}
                variant="text"
                onPress={() => navigation.navigate('ResetPassword')}
              />
            </View>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.text.primary, marginBottom: 6 }]}>
                {t('auth.forgot_password_title')}
              </Text>
              <Text
                style={{
                  color: colors.text.secondary,
                  textAlign: 'center',
                  marginBottom: 20,
                }}
              >
                {t('auth.forgot_password_subtitle')}
              </Text>
              <FormInput
                label={t('auth.email')}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <AppButton
                title={t('auth.send_reset_link')}
                onPress={() =>
                  requestReset({ email: email.trim(), locale: i18n.language })
                }
                loading={isPending}
                disabled={!email.trim()}
              />
              <AppButton
                title={t('auth.sign_in')}
                variant="text"
                onPress={() => navigation.navigate('SignIn')}
                style={{ marginTop: 12 }}
              />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingContainer>
  );
};

const TOKEN_FORMAT_REGEX = /^[A-Za-z0-9._-]{8,512}$/;

// ─── 4. Reset Password Screen ─────────────────────────────────────────────────

export const ResetPasswordScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const initialToken =
    typeof route?.params?.token === 'string' &&
    TOKEN_FORMAT_REGEX.test(route.params.token.trim())
      ? route.params.token.trim()
      : '';
  const [token, setToken] = useState<string>(initialToken);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  const { mutate: resetPwd, isPending, error } = useResetPassword(() => {
    setDone(true);
  });

  const apiError = (error as any)?.response?.data?.message || null;
  const pwdTooShort = !!newPassword && newPassword.length < 8;
  const pwdMismatch = !!confirmPassword && confirmPassword !== newPassword;
  const tokenValid = TOKEN_FORMAT_REGEX.test(token.trim());

  return (
    <KeyboardAvoidingContainer
      style={[styles.screen, { backgroundColor: colors.background.default }]}
    >
      <AuthHeaderBar />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.card,
            { backgroundColor: colors.background.paper, borderColor: colors.border },
          ]}
        >
          {done ? (
            <View style={{ alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 40 }}>✅</Text>
              <Text style={[styles.title, { color: colors.text.primary, marginBottom: 4 }]}>
                {t('auth.reset_password_success_title')}
              </Text>
              <Text style={{ color: colors.text.secondary, textAlign: 'center' }}>
                {t('auth.reset_password_success_message')}
              </Text>
              <AppButton
                title={t('auth.sign_in')}
                onPress={() => navigation.navigate('SignIn')}
                style={{ marginTop: 10 }}
              />
            </View>
          ) : (
            <>
              <Text style={[styles.title, { color: colors.text.primary, marginBottom: 6 }]}>
                {t('auth.reset_password_title')}
              </Text>
              <Text
                style={{
                  color: colors.text.secondary,
                  textAlign: 'center',
                  marginBottom: 18,
                }}
              >
                {t('auth.reset_password_subtitle')}
              </Text>

              {apiError && (
                <Text
                  style={{
                    color: colors.error.main,
                    textAlign: 'center',
                    marginBottom: 12,
                  }}
                >
                  {t(apiError)}
                </Text>
              )}

              {!initialToken && (
                <FormInput
                  label="Token"
                  value={token}
                  onChangeText={setToken}
                  autoCapitalize="none"
                />
              )}

              <FormInput
                label={t('auth.new_password')}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showPassword}
                error={
                  pwdTooShort ? t('auth.validation.password_min_length') : null
                }
                rightElement={
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <MaterialIcons
                      name={showPassword ? 'visibility' : 'visibility-off'}
                      size={20}
                      color={colors.text.secondary}
                    />
                  </TouchableOpacity>
                }
              />

              <FormInput
                label={t('auth.confirm_new_password')}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showPassword}
                error={
                  pwdMismatch ? t('auth.validation.passwords_mismatch') : null
                }
              />

              <AppButton
                title={t('auth.reset_password_button')}
                onPress={() => resetPwd({ token: token.trim(), newPassword })}
                loading={isPending}
                disabled={
                  !tokenValid ||
                  !newPassword ||
                  !confirmPassword ||
                  pwdTooShort ||
                  pwdMismatch
                }
              />

              <AppButton
                title={t('auth.sign_in')}
                variant="text"
                onPress={() => navigation.navigate('SignIn')}
                style={{ marginTop: 10 }}
              />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingContainer>
  );
};

// ─── 5. Verify Email Screen ───────────────────────────────────────────────────

export const VerifyEmailScreen: React.FC<{ navigation: any; route: any }> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();

  const initialToken =
    typeof route?.params?.token === 'string' &&
    TOKEN_FORMAT_REGEX.test(route.params.token.trim())
      ? route.params.token.trim()
      : null;

  const [manualToken, setManualToken] = useState<string>(initialToken || '');
  const [activeToken, setActiveToken] = useState<string | null>(initialToken);
  const isPendingParam = route?.params?.pending === true;
  const isManualTokenValid = TOKEN_FORMAT_REGEX.test(manualToken.trim());

  const { isLoading, isSuccess, error } = useVerifyEmail(activeToken);
  const errorKey =
    (error as any)?.response?.data?.message || 'auth.errors.invalid_or_expired_token';

  return (
    <KeyboardAvoidingContainer
      style={[styles.screen, { backgroundColor: colors.background.default }]}
    >
      <AuthHeaderBar />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.background.paper,
              borderColor: colors.border,
              alignItems: 'center',
            },
          ]}
        >
          {isLoading && (
            <>
              <Text style={{ fontSize: 42, marginBottom: 12 }}>⏳</Text>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                {t('auth.verify_email.verifying')}
              </Text>
            </>
          )}

          {isSuccess && (
            <>
              <Text style={{ fontSize: 46, marginBottom: 12 }}>✅</Text>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                {t('auth.verify_email.success_title')}
              </Text>
              <Text
                style={{
                  color: colors.text.secondary,
                  textAlign: 'center',
                  marginBottom: 20,
                }}
              >
                {t('auth.verify_email.success_message')}
              </Text>
              <AppButton
                title={t('auth.verify_email.go_to_login')}
                onPress={() => navigation.navigate('SignIn')}
              />
            </>
          )}

          {!isLoading && error && (
            <>
              <Text style={{ fontSize: 46, marginBottom: 12 }}>❌</Text>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                {t('auth.verify_email.error_title')}
              </Text>
              <Text
                style={{
                  color: colors.text.secondary,
                  textAlign: 'center',
                  marginBottom: 20,
                }}
              >
                {t(errorKey)}
              </Text>
              <AppButton
                title={t('auth.verify_email.go_to_login')}
                variant="outlined"
                onPress={() => navigation.navigate('SignIn')}
              />
            </>
          )}

          {!activeToken && isPendingParam && (
            <>
              <Text style={{ fontSize: 46, marginBottom: 12 }}>📧</Text>
              <Text style={[styles.title, { color: colors.text.primary }]}>
                {t('auth.verify_email.pending_title')}
              </Text>
              <Text
                style={{
                  color: colors.text.secondary,
                  textAlign: 'center',
                  marginBottom: 20,
                }}
              >
                {t('auth.verify_email.pending_message')}
              </Text>

              <FormInput
                label="Token (opcional)"
                value={manualToken}
                onChangeText={setManualToken}
                placeholder="Cole o token de verificação se desejar"
                autoCapitalize="none"
              />
              {isManualTokenValid ? (
                <AppButton
                  title="Verificar Token"
                  onPress={() => setActiveToken(manualToken.trim())}
                  style={{ width: '100%', marginBottom: 10 }}
                />
              ) : null}

              <AppButton
                title={t('auth.verify_email.go_to_login')}
                variant="outlined"
                onPress={() => navigation.navigate('SignIn')}
                style={{ width: '100%' }}
              />
            </>
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingContainer>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  authHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 10,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoBadgeText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 13,
  },
  brandName: {
    fontSize: 18,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 440,
    alignSelf: 'center',
    borderRadius: 18,
    padding: 24,
    borderWidth: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 22,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    padding: 20,
  },
});

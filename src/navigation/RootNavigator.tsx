import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useAppTheme } from 'src/theme';
import {
  useHasDebts,
  useHasGoals,
  useProcessedIncomesMonth,
  useTotalIncomes,
  useUser,
} from 'src/hooks/useApi';
import { useIncomeStore } from 'src/store/useIncomeStore';
import { useSelectedMonthYearStore } from 'src/store/useSelectedMonthYearStore';
import { Month, ProcessedIncomesMonthResponse } from 'src/types';
import { MonthYearPickerHeader } from 'src/components/MonthYearPickerHeader';
import { useToast } from 'src/components/Toast';

// Screens
import {
  ForgotPasswordScreen,
  RegistrationScreen,
  ResetPasswordScreen,
  SignInScreen,
  VerifyEmailScreen,
} from 'src/screens/auth/AuthScreens';
import {
  CompleteRegistrationScreen,
  SettingsScreen,
} from 'src/screens/SettingsAndOnboarding';
import { DashboardScreen } from 'src/screens/DashboardScreen';
import {
  EnvelopesScreen,
  ProcessedIncomesScreen,
  ReallocationScreen,
} from 'src/screens/EnvelopesAndIncomesScreens';
import { DebtsScreen, GoalsScreen } from 'src/screens/GoalsAndDebtsScreens';
import { ProfileScreen } from 'src/screens/ProfileScreen';

const AuthStack = createNativeStackNavigator();
const AppStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function getLastProcessed(
  processed: ProcessedIncomesMonthResponse
): { lastProcessedYear: number; lastProcessedMonth: Month } {
  const years = Object.keys(processed)
    .map(Number)
    .sort((a, b) => a - b);
  const lastYear = years[years.length - 1];
  const months = [...processed[lastYear]].sort((a, b) => a - b);
  const lastMonth = months[months.length - 1];
  return { lastProcessedYear: lastYear, lastProcessedMonth: lastMonth };
}

// ─── Top Bar for Authenticated Screens ────────────────────────────────────────

const MainHeaderBar: React.FC<{
  navigation: any;
  disableMonthPicker?: boolean;
}> = ({ navigation, disableMonthPicker }) => {
  const { colors } = useAppTheme();

  return (
    <View
      style={[
        styles.headerBar,
        {
          backgroundColor: colors.background.paper,
          borderBottomColor: colors.border,
        },
      ]}
    >
      <View style={styles.logoMini}>
        <View
          style={[
            styles.logoSquare,
            { backgroundColor: colors.primary.main },
          ]}
        >
          <Text style={styles.logoText}>EVE</Text>
        </View>
      </View>

      <MonthYearPickerHeader disabled={disableMonthPicker} />

      <View style={styles.rightActions}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Profile')}
          style={styles.iconBtn}
        >
          <MaterialIcons
            name="account-circle"
            size={24}
            color={colors.primary.main}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

// ─── Main Bottom Tabs ─────────────────────────────────────────────────────────

const MainTabsNavigator: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const [activeTabName, setActiveTabName] = useState('BudgetTab');

  const {
    month,
    year,
    hasMonthProcessed,
    setHasMonthProcessed,
    setNextMonthToProcess,
    setNextYearToProcess,
  } = useSelectedMonthYearStore();
  const setIncome = useIncomeStore((s) => s.setIncome);

  const { data: totalIncomes } = useTotalIncomes();
  const { data: processedIncomesMonths } = useProcessedIncomesMonth();
  const { hasDebts } = useHasDebts();
  const { hasGoals } = useHasGoals(year, month);

  useEffect(() => {
    if (totalIncomes?.total != null) {
      setIncome(totalIncomes.total);
    }
  }, [totalIncomes, setIncome]);

  useEffect(() => {
    if (processedIncomesMonths !== undefined) {
      const hasInfo = Object.keys(processedIncomesMonths).length > 0;
      const isSelectedMonthProcessed =
        hasInfo &&
        (processedIncomesMonths[year]?.includes(month as Month) ?? false);
      setHasMonthProcessed(isSelectedMonthProcessed);

      if (hasInfo) {
        const { lastProcessedYear, lastProcessedMonth } = getLastProcessed(
          processedIncomesMonths
        );
        if (lastProcessedMonth === 12) {
          setNextMonthToProcess(1);
          setNextYearToProcess(lastProcessedYear + 1);
          return;
        }
        setNextMonthToProcess((lastProcessedMonth + 1) as Month);
        setNextYearToProcess(lastProcessedYear);
      } else {
        const now = new Date();
        setNextMonthToProcess((now.getMonth() + 1) as Month);
        setNextYearToProcess(now.getFullYear());
      }
    }
  }, [
    processedIncomesMonths,
    month,
    year,
    setHasMonthProcessed,
    setNextMonthToProcess,
    setNextYearToProcess,
  ]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.default }}>
      <MainHeaderBar
        navigation={navigation}
        disableMonthPicker={activeTabName === 'SettingsTab'}
      />
      <Tab.Navigator
        screenListeners={{
          state: (e) => {
            const navState = e.data.state;
            const routeName = navState?.routes[navState.index]?.name;
            if (routeName) setActiveTabName(routeName);
          },
        }}
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary.main,
          tabBarInactiveTintColor: colors.text.secondary,
          tabBarStyle: {
            backgroundColor: colors.background.paper,
            borderTopColor: colors.border,
            height: 60 + insets.bottom,
            paddingBottom: insets.bottom + 6,
            paddingTop: 6,
          },
          tabBarItemStyle: {
            paddingHorizontal: 1,
          },
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
          },
        }}
      >
        <Tab.Screen
          name="BudgetTab"
          component={DashboardScreen}
          options={{
            tabBarLabel: t('nav.budget'),
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="pie-chart" size={size} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="EnvelopesTab"
          component={EnvelopesScreen}
          listeners={{
            tabPress: (e) => {
              if (!hasMonthProcessed) {
                e.preventDefault();
                showToast(t('home.no_envelopes_month_not_processed'), 'warning');
              }
            },
          }}
          options={{
            tabBarLabel: t('nav.envelopes'),
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons
                name={hasMonthProcessed ? 'mail' : 'lock'}
                size={size}
                color={hasMonthProcessed ? color : colors.error.main}
              />
            ),
          }}
        />

        <Tab.Screen
          name="IncomesTab"
          component={ProcessedIncomesScreen}
          options={{
            tabBarLabel: t('nav.incomes'),
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="trending-up" size={size} color={color} />
            ),
          }}
        />

        {hasGoals && (
          <Tab.Screen
            name="GoalsTab"
            component={GoalsScreen}
            options={{
              tabBarLabel: t('nav.goals'),
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons name="savings" size={size} color={color} />
              ),
            }}
          />
        )}

        {hasDebts && (
          <Tab.Screen
            name="DebtsTab"
            component={DebtsScreen}
            options={{
              tabBarLabel: t('nav.debts'),
              tabBarIcon: ({ color, size }) => (
                <MaterialIcons
                  name="account-balance"
                  size={size}
                  color={color}
                />
              ),
            }}
          />
        )}

        <Tab.Screen
          name="SettingsTab"
          component={SettingsScreen}
          options={{
            tabBarLabel: t('nav.settings'),
            tabBarIcon: ({ color, size }) => (
              <MaterialIcons name="settings" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </View>
  );
};

// ─── Root Navigator (PrivateRoute & Onboarding Guard) ─────────────────────────

export const RootNavigator: React.FC = () => {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const { data: user, isLoading, error } = useUser();

  if (isLoading) {
    return (
      <View
        style={[
          styles.loadingScreen,
          { backgroundColor: colors.background.default },
        ]}
      >
        <ActivityIndicator size="large" color={colors.primary.main} />
      </View>
    );
  }

  const isAuthenticated = !!user && !error;

  return (
    <NavigationContainer>
      {!isAuthenticated ? (
        <AuthStack.Navigator screenOptions={{ headerShown: false }}>
          <AuthStack.Screen name="SignIn" component={SignInScreen} />
          <AuthStack.Screen
            name="Registration"
            component={RegistrationScreen}
          />
          <AuthStack.Screen
            name="ForgotPassword"
            component={ForgotPasswordScreen}
          />
          <AuthStack.Screen
            name="ResetPassword"
            component={ResetPasswordScreen}
          />
          <AuthStack.Screen name="VerifyEmail" component={VerifyEmailScreen} />
        </AuthStack.Navigator>
      ) : !user.isRegistrationComplete ? (
        <AppStack.Navigator screenOptions={{ headerShown: false }}>
          <AppStack.Screen
            name="CompleteRegistration"
            component={CompleteRegistrationScreen}
          />
        </AppStack.Navigator>
      ) : (
        <AppStack.Navigator
          screenOptions={{
            headerStyle: { backgroundColor: colors.background.paper },
            headerTintColor: colors.text.primary,
            headerTitleStyle: { fontWeight: '800' },
          }}
        >
          <AppStack.Screen
            name="MainTabs"
            component={MainTabsNavigator}
            options={{ headerShown: false }}
          />
          <AppStack.Screen
            name="Reallocation"
            component={ReallocationScreen}
            options={{ title: t('envelope.transfer.title') }}
          />
          <AppStack.Screen
            name="Profile"
            component={ProfileScreen}
            options={{ title: t('profile.title') }}
          />
        </AppStack.Navigator>
      )}
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  logoMini: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoSquare: {
    width: 32,
    height: 32,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoText: {
    color: '#FFF',
    fontWeight: '900',
    fontSize: 12,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 4,
  },
});

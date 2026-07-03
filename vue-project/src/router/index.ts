import { createRouter, createWebHistory } from 'vue-router'

import {
  clearCurrentUser,
  fetchCurrentUserById,
  getCurrentUser,
  shouldRevalidateCurrentUser,
  type user_role,
} from '@/api/users'

const Login = () => import('@/pages/General/Login/vue/Login.vue')
const MakeAccount = () => import('@/pages/General/Login/vue/MakeAccount.vue')
const ForgotAccount = () => import('@/pages/General/Login/vue/ForgotAccount.vue')
const Privacypolicy = () => import('@/pages/General/Login/vue/Privacypolicy.vue')
const TermsOfService = () => import('@/pages/General/Login/vue/TermsOfService.vue')

const Situation = () => import('@/pages/General/Main/vue/Situation.vue')
const Account = () => import('@/pages/General/Main/vue/Account.vue')
const AccountSetting = () => import('@/pages/General/Main/vue/AccountSetting.vue')
const Score = () => import('@/pages/General/Main/vue/Score.vue')
const AVG_score = () => import('@/pages/General/Main/vue/AVG_score.vue')
const Setting = () => import('@/pages/General/Main/vue/Setting.vue')

const MailboxList = () => import('@/pages/General/Mailbox/vue/MailboxList.vue')
const MailOpen = () => import('@/pages/General/Mailbox/vue/MailOpen.vue')

const Explanation = () => import('@/pages/General/Mailbox/vue/FearEffect/Explanation.vue')

const Admin_Login = () => import('@/pages/Admin/Admin_Login.vue')
const Admin_Overview = () => import('@/pages/Admin/Admin_Overview.vue')
const Admin_Makequestion = () => import('@/pages/Admin/Admin_Makequestion.vue')
const Admin_Setting = () => import('@/pages/Admin/Admin_Setting.vue')

const Admin_Userdetail = () => import('@/pages/Admin/AdminUser/Admin_Userdetail.vue')

const Admin_QuestionList = () => import('@/pages/Admin/AdminQ/Admin_QuestionList.vue')
const Admin_QuestionDetail = () => import('@/pages/Admin/AdminQ/Admin_QuestionDetail.vue')
const Admin_QuestionView = () => import('@/pages/Admin/AdminQ/Admin_QuestionView.vue')

const learnerRouteNames = new Set([
  'Situation',
  'Account',
  'AccountSetting',
  'Score',
  'AVG_score',
  'Setting',
  'MailboxList',
  'MailOpen',
  'Explanation',
])

const adminRouteNames = new Set([
  'Admin_Overview',
  'Admin_Makequestion',
  'Admin_Setting',
  'Admin_Userdetail',
  'Admin_QuestionList',
  'Admin_QuestionDetail',
  'Admin_QuestionView',
])

const router = createRouter({
  history: createWebHistory(),

  //ここにページを配置
  routes: [
    {
      path: '/',
      name: 'Login',
      component: Login,
      meta: {
        sidebar: null,
        header: null,
      }
    },
    {
      path: '/makeaccount',
      name: 'MakeAccount',
      component: MakeAccount,
      meta: {
        sidebar: null,
        header: null,
      }
    },
    {
      path: '/forgotaccount',
      name: 'ForgotAccount',
      component: ForgotAccount,
      meta: {
        sidebar: null,
        header: null,
      }
    },
    {
      path: '/privacypolicy',
      name: 'Privacypolicy',
      component: Privacypolicy,
      meta: {
        sidebar: null,
        header: null,
      }
    },
    {
      path: '/termsofservice',
      name: 'TermsOfService',
      component: TermsOfService,
      meta: {
        sidebar: null,
        header: null,
      }
    },
    {
      path: '/situation',
      name: 'Situation',
      component: Situation,
      meta: {
        sidebar: 'user',
        header: null,
        shell: 'dark',
        fluid: true,
        flush: true,
      }
    },
    {
      path: '/account',
      name: 'Account',
      component: Account,
      meta: {
        sidebar: 'user',
        header: null,
        shell: 'dark',
        fluid: true,
        flush: true,
      }
    },
    {
      path: '/accountsetting',
      name: 'AccountSetting',
      component: AccountSetting,
      meta: {
        sidebar: 'user',
        header: null,
        shell: 'dark',
        fluid: true,
        flush: true,
      }
    },
    {
      path: '/score',
      name: 'Score',
      component: Score,
      meta: {
        sidebar: 'user',
        header: null,
        shell: 'dark',
        fluid: true,
        flush: true,
      }
    },
    {
      path: '/avg_score',
      name: 'AVG_score',
      component: AVG_score,
      meta: {
        sidebar: 'user',
        header: null,
        shell: 'dark',
        fluid: true,
        flush: true,
      }
    },
    {
      path: '/setting',
      name: 'Setting',
      component: Setting,
      meta: {
        sidebar: 'user',
        header: null,
        shell: 'dark',
        fluid: true,
        flush: true,
      }
    },
    {
      path: '/mailbox',
      name: 'MailboxList',
      component: MailboxList,
      meta: {
        sidebar: 'user',
        header: null,
        shell: 'dark',
        fluid: true,
        flush: true,
      }
    },
    {
      path: '/mailopen',
      name: 'MailOpen',
      component: MailOpen,
      meta: {
        sidebar: 'user',
        header: null,
        shell: 'dark',
        fluid: true,
        flush: true,
      }
    },
    {
      path: '/explanation',
      name: 'Explanation',
      component: Explanation,
      meta: {
        sidebar: 'user',
        header: null,
        shell: 'dark',
        fluid: true,
        flush: true,
      }
    },
    {
      path: '/admin_login',
      name: 'Admin_Login',
      component: Admin_Login,
      meta: {
        sidebar: null,
        header: null,
      }
    },
    {
      path: '/admin_overview',
      name: 'Admin_Overview',
      component: Admin_Overview,
      meta: {
        sidebar: 'admin',
        header: null,
        shell: 'dark',
        fluid: true,
        flush: true,
      }
    },
    {
      path: '/admin_makequestion',
      name: 'Admin_Makequestion',
      component: Admin_Makequestion,
      meta: {
        sidebar: 'admin',
        header: null,
        shell: 'dark',
        fluid: true,
        flush: true,
      }
    },
    {
      path: '/admin_setting',
      name: 'Admin_Setting',
      component: Admin_Setting,
      meta: {
        sidebar: 'admin',
        header: null,
        shell: 'dark',
        fluid: true,
        flush: true,
      }
    },
    {
      path: '/admin_userdetail',
      name: 'Admin_Userdetail',
      component: Admin_Userdetail,
      meta: {
        sidebar: 'admin',
        header: null,
      }
    },
    {
      path: '/admin_questionlist',
      name: 'Admin_QuestionList',
      component: Admin_QuestionList,
      meta: {
        sidebar: 'admin',
        header: null,
        shell: 'dark',
        fluid: true,
        flush: true,
      }
    },
    {
      path: '/admin_questiondetail',
      name: 'Admin_QuestionDetail',
      component: Admin_QuestionDetail,
      meta: {
        sidebar: 'admin',
        header: null,
        shell: 'dark',
        fluid: true,
        flush: true,
      }
    },
    {
      path: '/admin_questionview',
      name: 'Admin_QuestionView',
      component: Admin_QuestionView,
      meta: {
        sidebar: 'admin',
        header: null,
      }
    }
  ],
})

function routeNameString(name: unknown) {
  return typeof name === 'string' ? name : ''
}

function getRequiredRole(name: unknown): user_role | null {
  const routeName = routeNameString(name)

  if (adminRouteNames.has(routeName)) {
    return 'admin'
  }

  if (learnerRouteNames.has(routeName)) {
    return 'learner'
  }

  return null
}

function getLoginRouteName(role: user_role) {
  return role === 'admin' ? 'Admin_Login' : 'Login'
}

function getHomeRouteName(role: user_role) {
  return role === 'admin' ? 'Admin_Overview' : 'MailboxList'
}

router.beforeEach(async (to) => {
  const requiredRole = getRequiredRole(to.name)
  const storedUser = getCurrentUser()

  if (!requiredRole) {
    if (to.name === 'Login' && storedUser?.role === 'learner' && storedUser.is_active !== false) {
      return { name: getHomeRouteName('learner') }
    }

    if (to.name === 'Admin_Login' && storedUser?.role === 'admin' && storedUser.is_active !== false) {
      return { name: getHomeRouteName('admin') }
    }

    return true
  }

  const loginRouteName = getLoginRouteName(requiredRole)
  const redirect = { name: loginRouteName, query: { redirect: to.fullPath } }

  if (!storedUser || storedUser.is_active === false) {
    clearCurrentUser()
    return redirect
  }

  let resolvedUser = storedUser

  try {
    if (shouldRevalidateCurrentUser()) {
      resolvedUser = await fetchCurrentUserById(storedUser.id)
    }

    if (resolvedUser.role !== requiredRole || resolvedUser.is_active === false) {
      clearCurrentUser()
      return redirect
    }
  } catch (error) {
    console.error(error)
    clearCurrentUser()
    return redirect
  }

  return true
})

export default router

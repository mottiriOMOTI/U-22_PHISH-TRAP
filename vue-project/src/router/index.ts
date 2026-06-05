import { createRouter, createWebHistory } from 'vue-router'
import Home from '@/pages/Home.vue'
import About from '@/pages/About.vue'

import Login from '@/pages/General/Login/Login.vue'
import MakeAccount from '@/pages/General/Login/MakeAccount.vue'
import ForgotAccount from '@/pages/General/Login/ForgotAccount.vue'
import Privacypolicy from '@/pages/General/Login/Privacypolicy.vue'
import TermsOfService from '@/pages/General/Login/TermsOfService.vue'

import Situation from '@/pages/General/Main/Situation.vue'
import Account from '@/pages/General/Main/Account.vue'  
import AccountSetting from '@/pages/General/Main/AccountSetting.vue'
import Score from '@/pages/General/Main/Score.vue'
import Setting from '@/pages/General/Main/Setting.vue'

import MailboxList from '@/pages/General/Mailbox/MailboxList.vue'
import MailOpen from '@/pages/General/Mailbox/MailOpen.vue'

import FearEffect_Death from '@/pages/General/Mailbox/FearEffect/FearEffect_Death.vue'
import FearEffect_False from '@/pages/General/Mailbox/FearEffect/FearEffect_False.vue'
import Explanation from '@/pages/General/Mailbox/FearEffect/Explanation.vue'

import Admin_Login from '@/pages/Admin/Admin_Login.vue'
import Admin_Overview from '@/pages/Admin/Admin_Overview.vue'
import Admin_Makequestion from '@/pages/Admin/Admin_Makequestion.vue'
import Admin_Setting from '@/pages/Admin/Admin_Setting.vue'

import Admin_UserList from '@/pages/Admin/AdminUser/Admin_UserList.vue'
import Admin_Userdetail from '@/pages/Admin/AdminUser/Admin_Userdetail.vue'

import Admin_QuestionList from '@/pages/Admin/AdminQ/Admin_QuestionList.vue'
import Admin_QuestionDetail from '@/pages/Admin/AdminQ/Admin_QuestionDetail.vue'
import Admin_QuestionView from '@/pages/Admin/AdminQ/Admin_QuestionView.vue'

const router = createRouter({
  history: createWebHistory(),

  //ここにページを配置
  routes: [
    {
      path: '/home',
      name: 'Home',
      component: Home,
    },
    {
      path: '/about',
      name: 'About',
      component: About,
    },
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
        header: 'situation'
      }
    },
    {
      path: '/account',
      name: 'Account',
      component: Account,
      meta: {
        sidebar: 'user',
        header: 'account'
      }
    },
    {
      path: '/accountsetting',
      name: 'AccountSetting',
      component: AccountSetting,
      meta: {
        sidebar: 'user',
        header: 'account',
      }
    },
    {
      path: '/score',
      name: 'Score',
      component: Score,
      meta: {
        sidebar: 'user',
        header: 'score',
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
        header: 'mailboxList',
      }
    },
    {
      path: '/mailopen',
      name: 'MailOpen',
      component: MailOpen,
      meta: {
        sidebar: null,
        header: null,
      }
    },
    {
      path: '/feareffect_death',
      name: 'FearEffect_Death',
      component: FearEffect_Death,
      meta: {
        sidebar: null,
        header: null,
      }
    },
    {
      path: '/feareffect_false',
      name: 'FearEffect_False',
      component: FearEffect_False,
      meta: {
        sidebar: null,
        header: null,
      }
    },
    {
      path: '/explanation',
      name: 'Explanation',
      component: Explanation,
      meta: {
        sidebar: null,
        header: null,
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
        header: 'admin_overview',
      }
    },
    {
      path: '/admin_makequestion',
      name: 'Admin_Makequestion',
      component: Admin_Makequestion,
      meta: {
        sidebar: 'admin',
        header: 'admin_makequestion',
      }
    },
    {
      path: '/admin_setting',
      name: 'Admin_Setting',
      component: Admin_Setting,
      meta: {
        sidebar: 'admin',
        header: 'admin_setting',
      }
    },
    {
      path: '/admin_userlist',
      name: 'Admin_UserList',
      component: Admin_UserList,
      meta: {
        sidebar: 'admin',
        header: 'admin_userList',
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
        header: 'admin_questionList',
      }
    },
    {
      path: '/admin_questiondetail',
      name: 'Admin_QuestionDetail',
      component: Admin_QuestionDetail,
      meta: {
        sidebar: 'admin',
        header: null,
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

export default router

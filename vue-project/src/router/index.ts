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
      path: '/',
      name: 'Home',
      component: Home,
    },
    {
      path: '/about',
      name: 'About',
      component: About,
    },
    {
      path: '/login',
      name: 'Login',
      component: Login,
      meta: { layout: 'none' }
    },
    {
      path: '/makeaccount',
      name: 'MakeAccount',
      component: MakeAccount,
      meta: { layout: 'none' }
    },
    {
      path: '/forgotaccount',
      name: 'ForgotAccount',
      component: ForgotAccount,
      meta: { layout: 'none' }
    },
    {
      path: '/privacypolicy',
      name: 'Privacypolicy',
      component: Privacypolicy,
      meta: { layout: 'none' }
    },
    {
      path: '/termsofservice',
      name: 'TermsOfService',
      component: TermsOfService,
      meta: { layout: 'none' }
    },
    {
      path: '/situation',
      name: 'Situation',
      component: Situation,
      meta: { layout: 'user' }
    },
    {
      path: '/account',
      name: 'Account',
      component: Account,
      meta: { layout: 'user' }
    },
    {
      path: '/accountsetting',
      name: 'AccountSetting',
      component: AccountSetting,
      meta: { layout: 'user' }
    },
    {
      path: '/score',
      name: 'Score',
      component: Score,
      meta: { layout: 'user' }
    },
    {
      path: '/setting',
      name: 'Setting',
      component: Setting,
      meta: { layout: 'user' }
    },
    {
      path: '/mailbox',
      name: 'MailboxList',
      component: MailboxList,
      meta: { layout: 'user' }
    },
    {
      path: '/mailopen',
      name: 'MailOpen',
      component: MailOpen,
      meta: { layout: 'user' }
    },
    {
      path: '/feareffect_death',
      name: 'FearEffect_Death',
      component: FearEffect_Death,
      meta: { layout: 'none' }
    },
    {
      path: '/feareffect_false',
      name: 'FearEffect_False',
      component: FearEffect_False,
      meta: { layout: 'none' }
    },
    {
      path: '/explanation',
      name: 'Explanation',
      component: Explanation,
      meta: { layout: 'none' }
    },
    {
      path: '/admin_login',
      name: 'Admin_Login',
      component: Admin_Login,
      meta: { layout: 'none' }
    },
    {
      path: '/admin_overview',
      name: 'Admin_Overview',
      component: Admin_Overview,
      meta: { layout: 'admin' }
    },
    {
      path: '/admin_makequestion',
      name: 'Admin_Makequestion',
      component: Admin_Makequestion,
      meta: { layout: 'admin' }
    },
    {
      path: '/admin_setting',
      name: 'Admin_Setting',
      component: Admin_Setting,
      meta: { layout: 'admin' }
    },
    {
      path: '/admin_userlist',
      name: 'Admin_UserList',
      component: Admin_UserList,
      meta: { layout: 'admin' }
    },
    {
      path: '/admin_userdetail',
      name: 'Admin_Userdetail',
      component: Admin_Userdetail,
      meta: { layout: 'admin' }
    },
    {
      path: '/admin_questionlist',
      name: 'Admin_QuestionList',
      component: Admin_QuestionList,
      meta: { layout: 'admin' }
    },
    {
      path: '/admin_questiondetail',
      name: 'Admin_QuestionDetail',
      component: Admin_QuestionDetail,
      meta: { layout: 'admin' }
    },
    {
      path: '/admin_questionview',
      name: 'Admin_QuestionView',
      component: Admin_QuestionView,
      meta: { layout: 'admin' }
    }
  ],
})

export default router

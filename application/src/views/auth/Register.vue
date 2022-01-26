<template>
  <div class="d-flex align-items-center min-vh-100">
    <CContainer fluid>
      <CRow class="justify-content-center">
        <CCol md="6">
          <CCard class="mx-4 mb-0">
            <CCardBody class="p-4">
              <CForm>
                <h1>Sign up</h1>
                <p class="text-muted">Create your account</p>
                <CAlert show color="danger" v-if="apiError.message !== ''" v-html="apiError.message">Danger Alert</CAlert>
                <CInput
                    placeholder="Username"
                    autocomplete="username"
                    v-model="user.username"
                >
                  <template #prepend-content><CIcon name="cil-user"/></template>
                </CInput>
                <CInput
                    placeholder="Email"
                    autocomplete="email"
                    prepend="@"
                    v-model="user.email"
                />
                <CInput
                    placeholder="Password"
                    type="password"
                    autocomplete="new-password"
                    v-model="user.password"
                >
                  <template #prepend-content><CIcon name="cil-lock-locked"/></template>
                </CInput>
                <CInput
                    placeholder="Repeat password"
                    type="password"
                    autocomplete="new-password"
                    class="mb-4"
                    v-model="user.confirm"
                >
                  <template #prepend-content><CIcon name="cil-lock-locked"/></template>
                </CInput>
                <CButton color="success" block
                         @keyup.enter="submit()"
                         @click.stop.prevent="submit()"
                         :disabled="disabled"
                >Create Account</CButton>
              </CForm>
            </CCardBody>
            <CCardFooter class="p-4">
              <CRow>
                <CCol col="6">
                  <p>
                    Already have an account? <router-link :to="{name: 'Login'}">Login</router-link>
                  </p>
                </CCol>
              </CRow>
            </CCardFooter>
          </CCard>
        </CCol>
      </CRow>
    </CContainer>
  </div>
</template>

<script>
import authMixin from '@/mixins/auth'
import {AUTH_SIGNUP} from "../../store/actions/auth";

export default {
  name: 'Register',
  mixins: [authMixin],
  data () {
    return {
      disabled: false,
      apiError: {
        message: ''
      },
      user: {
        username: '',
        email: '',
        password: '',
        confirm: ''
      }
    }
  },
  methods: {
    validate () {
      return this.user.email !== '' && this.user.password !== '' && this.user.confirm !== ''
    },
    submit () {
      // this.disabled = true
      this.apiError.message = ''
      if (this.validate()) {
        this.$store.dispatch(AUTH_SIGNUP, {user: this.user, url: this.url})
            .then(r => {
              if (r.message) {
                this.apiError.message = r.message
                this.disabled = false
              }
              this.disabled = false
              if (r.user) {
                this.$router.push({
                  name: '2fa'
                })
              }
            })
            .catch(e => {
              this.apiError.message = e.message
            })
            .finally(() => {
              this.disabled = false
            })
      } else {
        this.showError = true
      }
    }
  }
}
</script>

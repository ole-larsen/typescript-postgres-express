<template>
  <div class="c-app flex-row align-items-center">
    <CContainer>
      <CRow class="justify-content-center">
        <CCol md="8">
          <CCardGroup>
            <CCard class="p-4">
              <CCardBody>
                <CForm>
                  <h1>Login</h1>
                  <p class="text-muted">Sign In to your account</p>
                  <CAlert show color="danger" v-if="apiError.message !== ''" v-html="apiError.message">Danger Alert</CAlert>
                  <CInput
                      placeholder="Username"
                      autocomplete="username email"
                      v-model="user.email"
                  >
                    <template #prepend-content><CIcon name="cil-user"/></template>
                  </CInput>
                  <CInput
                      placeholder="Password"
                      type="password"
                      autocomplete="current-password"
                      v-model="user.password"
                  >
                    <template #prepend-content><CIcon name="cil-lock-locked"/></template>
                  </CInput>
                  <CRow>
                    <CCol col="6" class="text-left">
                      <CButton color="primary" class="px-4"
                        @keyup="submit()"
                        @click.stop.prevent="submit()" :disabled="disabled">Login</CButton>
                    </CCol>
                    <CCol col="6" class="text-right">
                      <router-link :to="{name: 'Forgot'}">
                        <CButton color="link" class="px-0">Forgot password?</CButton>
                      </router-link>
                      <router-link :to="{name: 'Signup'}">
                        <CButton color="link" class="d-lg-none">Register now!</CButton>
                      </router-link>
                    </CCol>
                  </CRow>
                </CForm>
              </CCardBody>
            </CCard>
            <CCard
                color="primary"
                text-color="white"
                class="text-center py-5 d-md-down-none"
                body-wrapper
            >
              <CCardBody>
                <h2>Sign up</h2>
                <p></p>
                <router-link :to="{name: 'Signup'}">
                <CButton
                    color="light"
                    variant="outline"
                    size="lg"
                >
                  Register Now!
                </CButton>
                </router-link>
              </CCardBody>
            </CCard>
          </CCardGroup>
        </CCol>
      </CRow>
    </CContainer>
  </div>
</template>

<script>
import {AUTH_LOGIN} from "@/store/actions/auth";
import authMixin from '@/mixins/auth'
export default {
  name: 'Login',
  mixins: [authMixin],
  methods: {
    validate () {
      if (!this.user.password) {
        this.apiError.message = 'password must not be empty'
      }
      if (!this.user.email) {
        this.apiError.message = 'email must not be empty'
      }
      return this.user.email !== '' && this.user.password !== ''
    },
    submit () {
      this.disabled = true
      this.apiError.message = ''
      setTimeout(() => {
        this.disabled = false;
        this.apiError.message = ''
      }, 3000)
      if (this.validate()) {
        this.$store.dispatch(AUTH_LOGIN, {user: this.user, url: this.url})
          .then(response => {
            if (response.message) {
              this.apiError.message = response.message
              this.disabled = false
            }
            if (response.id) {
              this.$router.push({
                name: '2fa'
              })
            }
          })
          .catch(e => {
            if (e.message) {
              this.apiError.message = e.message
              this.disabled = false
            }
          })
          .finally(() => {
            this.disabled = false
          })
      } else {

      }
      return false
    }
  },
  data () {
    return {
      disabled: false,
      apiError: {
        message: ''
      },
      user: {
        email: '',
        password: ''
      }
    }
  }
}
</script>

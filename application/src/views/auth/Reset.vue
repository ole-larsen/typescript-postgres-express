<template>
  <div class="d-flex align-items-center min-vh-100">
    <CContainer fluid>
      <CRow class="justify-content-center">
        <CCol md="3">
          <CCard class="mx-4 mb-0">
            <CCardBody class="p-4">
              <CForm>
                <h1>Reset Password</h1>
                <p class="text-muted">Enter your email address below and we will send you password reset instructions.</p>
                <CAlert show color="success" v-if="apiNote.message !== ''" v-html="`${apiNote.message} for restore password`">Successful Alert</CAlert>
                <CAlert show color="danger" v-if="apiError.message !== ''" v-html="apiError.message">Danger Alert</CAlert>
                <CInput
                    placeholder="Password"
                    autocomplete=""
                    type="password"
                    v-model="user.password"
                >
                </CInput>
                <CInput
                    placeholder="Confirm"
                    autocomplete=""
                    type="password"
                    v-model="user.confirm"
                >
                </CInput>
              </CForm>
            </CCardBody>
            <CCardFooter class="p-4">
              <CRow>
                <CCol col="6">
                  <CButton block color="primary"
                           @keyup.enter="submit()"
                           @click.stop.prevent="submit()"
                           :disabled="disabled"
                  >
                    enter
                  </CButton>
                </CCol>
                <CCol col="6">
                  <router-link :to="{name: 'Login'}">
                    <CButton block color="primary"
                    >
                      login
                    </CButton>
                  </router-link>
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
import {AUTH_RESET} from "../../store/actions/auth";

export default {
  name: 'Reset',
  mixins: [authMixin],
  data () {
    return {
      disabled: false,
      user: {
        password: '',
        confirm: ''
      },
      apiError: {
        message: ''
      },
      apiNote: {
        message: ''
      }
    }
  },
  methods: {
    validate () {
      return this.user.password === '' || this.user.confirm !== '';
    },
    submit () {
      this.disabled = true
      this.apiError.message = ''
      this.apiNote.message = ''
      const token = this.$route.params.token
      if (this.validate()) {
        this.$store.dispatch(AUTH_RESET, {token: token, url: this.url, user: this.user})
            .then(response => {
              if (response && response.message) {
                this.apiError.message = response.message
              }
              if (response && response.id) {
                this.$router.push({
                  name: 'Login'
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
        console.log('here is going auth error')
      }
    }
  }
}
</script>

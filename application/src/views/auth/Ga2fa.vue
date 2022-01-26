<template>
  <div class="d-flex align-items-center min-vh-100">
    <CContainer fluid>
      <CRow class="justify-content-center">
        <CCol md="3">
          <CCard class="mx-4 mb-0">
            <CCardBody class="p-4">
              <CForm>
                <h1>2-FA</h1>
                <div v-if="user.qr">
                  <p class="text-muted">Save this code in safety place!</p>
                  <div class="alert alert-dark" role="alert"><code v-html="user.code" class="highlight"></code></div>
                  <div v-html="user.qr" style="width: 60%; margin-left: -6px;"></div>
                </div>
                <p class="text-muted">Enter Your Google Authenticator 6-Digit Code</p>
                <CAlert show color="danger" v-if="apiError.message !== ''" v-html="apiError.message">Danger Alert</CAlert>
                <CInput
                    placeholder="2-FA code"
                    autocomplete=""
                    v-model="user.code"
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
                           :disabled="disabled2FA"
                  >
                    enter
                  </CButton>
                </CCol>
                <CCol col="6">
                  <CButton block color="danger"
                           @keyup.enter="logout()"
                           @click.stop.prevent="logout()"
                           :disabled="disabledLogout"
                  >
                    logout
                  </CButton>
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
  import {AUTH_LOGOUT, AUTH_SIGNIN, USER_2FA_REQUEST} from '../../store/actions/auth'

  export default {
  name: 'Ga2fa',
  mixins: [authMixin],
  data () {
    return {
      disabled2FA: false,
      disabledLogout: false,
      apiError: {
        message: ''
      },
      user: {
        id: null,
        qr: null,
        code: ''
      }
    }
  },
  mounted () {
    this.apiError.message = ''
    // first load for test secret set
    fetch(`${this.url}/api/v1/auth/2fa`, {
      method: 'POST', // or 'PUT'
      headers: {
        'Content-Type': 'application/json'
      },
      body: localStorage.getItem('user')
    }).then(r => r.json())
      .then(r => {
        if (r.qr && r.secret) {
          this.user.qr = r.qr
          this.user.code = r.secret
        }
      })
  },
  methods: {
    validate () {
      return this.user.code !== ''
    },
    submit () {
      this.apiError.message = ''
      if (this.validate()) {
        this.user.id = (JSON.parse(localStorage.getItem('user'))).id
        this.$store.dispatch(USER_2FA_REQUEST, {user: this.user, url: this.url})
            .then(r => {
              if (r) {
                if (r['access_token']) {
                  this.$router.push({
                    name: 'Home'
                  })
                }
              }
            })
            .catch(e => {
              this.apiError.message = e.message
              localStorage.removeItem('access_token')
            })
      } else {
        this.apiError.message = 'no 2FA code'
      }
      return false
    },
    logout () {
      this.user = JSON.parse(localStorage.getItem('user'))
      this.$store.dispatch(AUTH_LOGOUT, {user: this.user, url: this.url})
          .then(r => {
            console.log(r)
            if (r.user) {
              localStorage.removeItem('access_token')
              localStorage.removeItem('token_type')
              localStorage.removeItem('user')
              this.$router.push({
                name: 'Login'
              })
            }
          })
          .catch(e => {
            console.log(e)
          })
    }
  }
}
</script>

<template>
  <CCard>
    <CCardHeader>
      <CButton @click="create" color="success" v-if="isSuperAdmin || isAdmin">Create Task</CButton>
      <div style="display: inline-block; float: right;">
        <CButtonGroup class="export-btn">
          <CButton square size="sm" variant="ghost" color="success" class="btn btn-success btn-sm btn-ghost-success">
            <CInputFile size="sm" variant="ghost" color="secondary"
                        label="Import Excel" class="importFile"
                        horizontal @change="onChange($event)">Import Excel</CInputFile>
          </CButton>
          <CButton size="sm" variant="ghost" color="success" square @click="exportAsExcel()">Export Excel</CButton>
          <CButton size="sm" variant="ghost" color="dark"    square @click="exportAsCsv()">Export CSV</CButton>
        </CButtonGroup>
      </div>
    </CCardHeader>
    <CCardBody>
      <CAlert show color="danger" v-if="apiError.message" v-html="apiError.message">Danger Alert</CAlert>
      <CDataTable
          class="mb-0 table-outline"
          hover
          :items="filteredItems"
          :fields="tableFields"
          head-color="light"
          :striped="true"
          :border="true"
          :small="true"
          :items-per-page="20"
          :pagination="true"
          column-filter
          table-filter
          items-per-page-select
          sorter
          :selectable="true"
      >
        <template slot="enabled-header">
          <div class="enabled">
            <div>Enabled</div>
            <CSwitch v-if="isSuperAdmin || isAdmin"
                     class="center"
                     size="sm"
                     shape="pill"
                     color="info"
                     data-on="On"
                     data-off="Off"
                     @update:checked="handleMassChangeEnabled()"
            />
          </div>
        </template>
        <td slot="id" slot-scope="{item}">
          <CInputCheckbox
              :value="item.id"
              :label="item.id.toString()"
              :custom="true"
              :name="item.id"
              :inline="true"
              @update:checked="handleCheckboxTicker"
          />
        </td>
        <td slot="config" slot-scope="{item}">
          <div class="config">
            <div v-for="(field, key) in item.config">
              <p>{{ key }}: {{ field }}</p>
            </div>
          </div>
        </td>
        <td slot="enabled" slot-scope="{item}">
          <CSwitch v-if="isSuperAdmin || isAdmin"
              class="center"
              size="sm"
              shape="pill"
              color="info"
              data-on="On"
              data-off="Off"
              :checked="item.enabled"
              @update:checked="handleChangeEnabled(item)"
          />
          <template v-else>
            {{item.enabled ? 'enabled' : 'disabled'}}
          </template>
        </td>

        <td slot="controls" slot-scope="{item}" v-if="isSuperAdmin || isAdmin">
          <CButtonGroup>
            <CButton color="danger" @click.stop.prevent="remove(item)" v-if="isSuperAdmin">Remove</CButton>
          </CButtonGroup>
        </td>
        <template #show_details="{item, index}">
          <td class="py-2">
            <CButton
                color="primary"
                variant="outline"
                square
                size="sm"
                @click="toggleDetails(item, index)"
            >
              {{Boolean(item._toggled) ? 'Hide' : 'Show'}}
            </CButton>
          </td>
        </template>
        <template #details="{item}">
          <CCollapse :show="Boolean(item._toggled)" :duration="collapseDuration">
            <CCardBody>
              <base-form
                  :item-for-update="itemForUpdate"
                  :api-error="apiError"
                  @reset="reset"
                  @update="update"
                  @handleChangeEnabled="handleChangeEnabled"
              ></base-form>
            </CCardBody>
          </CCollapse>
        </template>
      </CDataTable>
      <base-modal
          :item-for-update="itemForUpdate"
          :api-error="apiError"
          :dark-modal="darkModal"
          @reset="reset"
          @update="update"
          @handleChangeEnabled="handleChangeEnabled"
      ></base-modal>
    </CCardBody>
  </CCard>
</template>
<script>
import authMixin from '@/mixins/auth'
import moment from "moment";
import {GET_TASK, GET_TASKS, REMOVE_TASK, SET_TASK, SET_TICKER_SCHEDULER} from "@/store/actions/tasks";
import * as XLSX from "xlsx";
import BaseForm from "@/components/forms/Base.Form";
import BaseModal from "@/components/modals/Base.Modal";

export default {
  name: 'Tasks',
  components: {BaseModal, BaseForm},
  mixins: [authMixin],
  watch: {
    computedItems: {
      immediate: true,
      handler (items) {
        this.filteredItems = items
      }
    },
  },
  mounted () {
    this.fetch(GET_TASKS)
  },
  computed: {
    computedItems () {
      return this.tableItems.map(item => {
        return {
          ...item
        }
      })
    }
  },
  data () {
    return {
      filteredItems: [],
      filter: {},
      loadTickersManually: false,
      apiError: {
        message: undefined
      },
      tableItems: [],
      selectedItems: [],
      tableFields: [],
      darkModal: false,
      itemForUpdate: {
        id: null,
        name: "",
        identity: "",
        config: {
          query: "",
          metrics: "",
          scheduler: "* * * * *",
        },
        status: "",
        enabled: true,
      },
      details: [],
      collapseDuration: 0
    }
  },
  methods: {
    onChange(event) {
      const file = event[0]
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          const bstr = e.target.result
          const wb = XLSX.read(bstr, { type: 'binary' })
          const wsname = wb.SheetNames[0]
          const ws = wb.Sheets[wsname]
          const data = XLSX.utils.sheet_to_json(ws, { header: 0 })
          this.tableItems = data
          data.map(item => {
            this.dispatch(SET_TASK, item, true)
          })
        }
        reader.readAsBinaryString(file);
      }
    },
    exportAsExcel () {
      const format = 'xlsx'
      const filename = `task`
      this.exportTable(this.filteredItems, this.tableFields, filename, format)
    },
    exportAsCsv () {
      const format = 'csv'
      const filename = `task`
      this.exportTable(this.filteredItems, this.tableFields, filename, format)
    },
    handleCheckboxTicker (value, e) {
      if (value === true) {
        this.selectedItems.push(this.tableItems.find(item => item.id === Number(e.target.value)))
      } else {
        this.selectedItems = this.selectedItems.filter(item => item.id !== Number(e.target.value))
      }
      this.selectedItems = [...new Set(this.selectedItems)]
    },
    create () {
      this.reset()
      this.darkModal = true
    },
    update (item) {
      // if id then update else create
      if (item.id) {
        this.$set(this.filteredItems.find(i => i.id === item.id), '_toggled', false)
      }
      this.dispatch(SET_TASK, item)
      this.reset()
    },
    reset () {
      this.itemForUpdate = {
        id: null,
        name: "",
        identity: "",
        config: {
          query: "",
          metrics: "",
          scheduler: "* * * * *",
        },
        status: "",
        enabled: true,
      }
      this.darkModal = false
    },
    edit (item) {
      if (item) {
        this.dispatch(GET_TASK, item)
      }
    },
    remove (item) {
      this.dispatch(REMOVE_TASK, item)
    },
    load(item) {
      this.itemForUpdate = item
      // this.darkModal = true
    },
    dispatch (itemForUpdate, item, xls = false) {
      this.apiError.message = undefined
      this.$store.dispatch(itemForUpdate, {url: this.url, item, xls: xls})
          .then(response => {
            switch(itemForUpdate) {
              case GET_TASK:
                this.load(JSON.parse(JSON.stringify(response)))
                break
              case SET_TASK:
                this.fetch(GET_TASKS)
                break
              case REMOVE_TASK:
                this.fetch(GET_TASKS)
                break
            }
          })
          .catch(e => {
            this.apiError.message = e.message
            setTimeout(() => {
              this.apiError.message = undefined;
            }, 10000);
          })
    },
    handleMassChangeEnabled () {
      this.filteredItems.forEach(item => {
        this.dispatch(SET_TASK, item)
      })
    },
    handleChangeEnabled (item) {
      item.enabled = !item.enabled
      this.dispatch(SET_TASK, item)
    },
    fetch (type) {
      this.$store.dispatch(type, {url: this.url})
        .then(items => {
          this.tableFields = [
            { key: 'id'},
            { key: 'name', label: 'Name' },
            { key: 'identity', label: 'Identity' },
            { key: 'config', label: 'Config' },
            { key: 'status', label: 'Status' },
            { key: 'updated' },
            { key: 'enabled', _classes: 'text-left' },
            {
              key: 'show_details',
              label: '',
              _style: 'width:1%',
              sorter: false,
              filter: false
            }
          ]
          if (this.isSuperAdmin || this.isAdmin) {
            this.tableFields.push({ key: 'controls' })
          }
          this.tableItems = JSON.parse(JSON.stringify(items)).map(item => {
            item.updated = moment().format("DD/MM/YYYY hh:mm:ss")
            item._toggled = false
            return item
          })
        })
        .catch(e => {
          console.log(e)
        })
    },
    toggleDetails (item) {
      const selected = this.filteredItems.find(i => i.id === item.id)
      this.$set(selected, '_toggled', !item._toggled)
      this.dispatch(GET_TASK, selected)
      this.collapseDuration = 300
      this.$nextTick(() => { this.collapseDuration = 0})
    }
  }
}
</script>
<style lang="scss">
  .switch-wrap {
    display: inline-block;
    margin-left: 16px;
    position: relative;
    top: 8px;
  }
  .switch-label {
    position: relative;
    top: -8px;
  }
  .config {
    display: flex;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: flex-start;
    align-items: flex-start;
    align-content: flex-start;
    gap: 0 10px;
  }
</style>
<template>
  <CCard>
    <CCardHeader>
      <div style="display: inline-block; float: right;">
        <CButtonGroup class="export-btn">
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
      </CDataTable>
    </CCardBody>
  </CCard>
</template>
<script>
import authMixin from '@/mixins/auth'
import moment from "moment";
import {GET_TIMESERIES} from "@/store/actions/timeSeries";
import * as XLSX from "xlsx";
import BaseForm from "@/components/forms/Base.Form";
import BaseModal from "@/components/modals/Base.Modal";

export default {
  name: 'TimeSeries',
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
    this.fetch(GET_TIMESERIES)
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
      apiError: {
        message: undefined
      },
      tableItems: [],
      selectedItems: [],
      tableFields: [],
      darkModal: false,
      itemForUpdate: {
        name: "",
        identity: "",
        value: 0,
        text: "",
      },
      details: [],
      collapseDuration: 0
    }
  },
  methods: {
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
    dispatch (itemForUpdate, item, xls = false) {
      this.apiError.message = undefined
      this.$store.dispatch(itemForUpdate, {url: this.url, item, xls: xls})
          .then(response => {
            switch(itemForUpdate) {
              case GET_TIMESERIES:
                this.fetch(GET_TIMESERIES);
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
    fetch (type) {
      this.$store.dispatch(type, {url: this.url})
        .then(items => {
          this.tableFields = [
            { key: 'name', label: 'Name' },
            { key: 'identity', label: 'Identity' },
            { key: 'value', label: 'Value' }
          ]
          this.tableItems = JSON.parse(JSON.stringify(items)).map(item => {
            item.updated = moment().format("DD/MM/YYYY hh:mm:ss")
            item._toggled = false
            return item
          })
        })
        .catch(e => {
          console.log(e)
        })
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
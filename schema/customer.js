const customerSchema = {
  type: 'object',
  properties: {
    Taxable: {
      type: 'boolean'
    },
    BillAddr: {
      type: 'object',
      properties: {
        Id: {
          type: 'string'
        },
        Line1: {
          type: 'string'
        },
        City: {
          type: 'string'
        },
        CountrySubDivisionCode: {
          type: 'string'
        },
        PostalCode: {
          type: 'string'
        },
        Lat: {
          type: 'string'
        },
        Long: {
          type: 'string'
        }
      }
    },
    ShipAddr: {
      type: 'object',
      properties: {
        Id: {
          type: 'string'
        },
        Line1: {
          type: 'string'
        },
        City: {
          type: 'string'
        },
        CountrySubDivisionCode: {
          type: 'string'
        },
        PostalCode: {
          type: 'string'
        },
        Lat: {
          type: 'string'
        },
        Long: {
          type: 'string'
        }
      }
    },
    Job: {
      type: 'boolean'
    },
    BillWithParent: {
      type: 'boolean'
    },
    Balance: {
      type: 'number'
    },
    BalanceWithJobs: {
      type: 'number'
    },
    CurrencyRef: {
      type: 'object',
      properties: {
        value: {
          type: 'string'
        },
        name: {
          type: 'string'
        }
      }
    },
    PreferredDeliveryMethod: {
      type: 'string'
    },
    domain: {
      type: 'string'
    },
    sparse: {
      type: 'boolean'
    },
    Id: {
      type: 'string'
    },
    SyncToken: {
      type: 'string'
    },
    MetaData: {
      type: 'object',
      properties: {
        CreateTime: {
          type: 'string'
        },
        LastUpdatedTime: {
          type: 'string'
        }
      }
    },
    GivenName: {
      type: 'string'
    },
    FamilyName: {
      type: 'string'
    },
    FullyQualifiedName: {
      type: 'string'
    },
    CompanyName: {
      type: 'string'
    },
    DisplayName: {
      type: 'string'
    },
    PrintOnCheckName: {
      type: 'string'
    },
    Active: {
      type: 'boolean'
    },
    PrimaryPhone: {
      type: 'object',
      properties: {
        FreeFormNumber: {
          type: 'string'
        }
      }
    },
    PrimaryEmailAddr: {
      type: 'object',
      properties: {
        Address: {
          type: 'string'
        }
      }
    }
  }
}


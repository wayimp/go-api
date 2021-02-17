const invoiceSchema = {
  type: 'object',
  properties: {
    AllowIPNPayment: {
      type: 'boolean'
    },
    AllowOnlinePayment: {
      type: 'boolean'
    },
    AllowOnlineCreditCardPayment: {
      type: 'boolean'
    },
    AllowOnlineACHPayment: {
      type: 'boolean'
    },
    TxnDate: {
      type: 'string'
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
    Line: {
      type: 'array',
      items: [
        {
          type: 'object',
          properties: {
            Id: {
              type: 'string'
            },
            LineNum: {
              type: 'integer'
            },
            Description: {
              type: 'string'
            },
            Amount: {
              type: 'integer'
            },
            DetailType: {
              type: 'string'
            },
            SalesItemLineDetail: {
              type: 'object',
              properties: {
                ItemRef: {
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
                UnitPrice: {
                  type: 'integer'
                },
                Qty: {
                  type: 'integer'
                },
                ItemAccountRef: {
                  type: 'object',
                  properties: {
                    value: {
                      type: 'string'
                    },
                    name: {
                      type: 'string'
                    }
                  }
                }
              }
            }
          }
        }
      ]
    },
    CustomerRef: {
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
    CustomerMemo: {
      type: 'object',
      properties: {
        value: {
          type: 'string'
        }
      }
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
        Line2: {
          type: 'string'
        },
        Line3: {
          type: 'string'
        },
        Line4: {
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
    DueDate: {
      type: 'string'
    },
    TotalAmt: {
      type: 'number'
    },
    ApplyTaxAfterDiscount: {
      type: 'boolean'
    },
    PrintStatus: {
      type: 'string'
    },
    EmailStatus: {
      type: 'string'
    },
    BillEmail: {
      type: 'object',
      properties: {
        Address: {
          type: 'string'
        }
      }
    },
    Balance: {
      type: 'number'
    }
  }
}

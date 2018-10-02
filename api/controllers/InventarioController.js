/**
 * InventarioController
 *
 * @description :: Server-side actions for handling incoming requests.
 * @help        :: See https://sailsjs.com/docs/concepts/actions
 */

module.exports = {
  newsale: {
    friendlyName: 'Venta de inventario',
    description: 'Corroborar el estado del inventario y hacer la venta consecuente',
    inputs: {
      fecha: {
        type: 'number',
        required: true
      },
      items: {
        type: 'json',
        required: true
      },
      total: {
        type: 'number',
        required: true
      },
      utilidad: {
        type: 'number',
        required: true
      },
      vendedor: {
        type: 'ref',
        required: true
      }
    },
    exits: {
      success: {
        description: "Todo salio bien"
      },
      error:{
        description: "Algo salio mal",
        statusCode: 500
      }
    },
    fn: async function (inputs, exits) {
      for(let i=0; i<inputs.items.length; i++){
        let itemDB = await Item.findOne({
          id: inputs.items[i].id
        });
        if(itemDB){
          await Item.update({
            id: itemDB.id
          }).set({
            unidades: itemDB.unidades - inputs.items[i].unidades
          });
          await VentaInventario.create({
            fecha: inputs.fecha,
            items: inputs.items,
            total: inputs.total,
            utilidad: inputs.utilidad,
            vendedor: inputs.vendedor
          })
          return exits.success("Venta registrada correctamente");
        }else{
          return exits.error();
        }
      }
    }
  },
  checkstock:{
    friendlyName: 'Comprobar inventario',
    description: 'Funcion encargada de validar las unidades a descontar del inventario en caso de compra',
    inputs: {
      itemID:{
        type: 'ref',
        required: true
      },
      unidades:{
        type: 'number',
        required: true
      }
    },
    exits: {
      success: {
        description: "Todo salio bien"
      },
      unStocked: {
        description: "Uno o mas items no tienen inventario para completar la transaccion",
        statusCode: 404
      },
      error: {
        description: "Ocurrio un error en la base de datos",
        statusCode: 500
      }
    },
    fn: async function(inputs, exits){
      let itemDB = await Item.findOne({
        id: inputs.itemID
      });
      if(itemDB){
        if(itemDB.unidades >= inputs.unidades){
          return exits.success();
        }else{
          return exits.unStocked("No hay suficiente inventario para la venta");
        }
      }else{
        return exits.error();
      }
    }
  },
  restock:{
    friendlyName: 'Recargar el inventario',
    description: 'Funcion encargada de renovar el inventario.',
    inputs: {
      itemID:{
        type: 'ref',
        required: true
      },
      unidades:{
        type: 'number',
        required: true
      },
      precio_compra: {
        type: 'number',
        required: true
      },
      comprador: {
        type: 'ref',
        required: true
      }
    },
    exits: {
      success: {
        description: "Todo salio bien"
      },
      error: {
        description: "Ocurrio un error en la base de datos",
        statusCode: 500
      }
    },
    fn: async function(inputs, exits){
      let item = await Item.findOne({
        id: inputs.itemID
      });
      await Item.update({
        id: inputs.itemID
      }).set({
        unidades: item.unidades + inputs.unidades,
        precio_compra: _.floor(((item.unidades*item.precio_compra)+(inputs.unidades*inputs.precio_compra))/(item.unidades+inputs.unidades), -1)
      });
      await CompraInventario.create({
        fecha: Date.now(),
        item: item.descripcion,
        unidades: inputs.unidades,
        precio_compra: inputs.precio_compra,
        comprador: inputs.comprador
      });
      return exits.success("Item recargado correctamente");
    }
  }
};

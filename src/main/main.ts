import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer } from '@electron-toolkit/utils'
import icon from '../../resources/icon.png?asset'
import { AsaasService } from './services/asaas.service'

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 670,
    show: false,
    title: 'CCA. Split',
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    frame: false,
    webPreferences: {
      preload: join(__dirname, 'preload.js'),
      sandbox: false
    }
  })

  // Window control handlers
  ipcMain.on('window-minimize', () => {
    console.log('Main: Minimizing window')
    mainWindow.minimize()
  })

  ipcMain.on('window-maximize', () => {
    console.log('Main: Maximizing/Restoring window')
    if (mainWindow.isMaximized()) {
      mainWindow.unmaximize()
    } else {
      mainWindow.maximize()
    }
  })

  ipcMain.on('window-close', () => {
    console.log('Main: Closing window')
    mainWindow.close()
  })

  ipcMain.handle('get-app-version', () => {
    return app.getVersion()
  })

  // Asaas Handlers
  ipcMain.handle(
    'asaas:setup-payment',
    async (_, data: { name: string; email: string; cpfCnpj: string; mobilePhone: string }) => {
      try {
        // 1. Procurar ou criar cliente
        let customer = await AsaasService.findCustomerByCpfCnpj(data.cpfCnpj)
        if (!customer) {
          customer = await AsaasService.createCustomer({
            name: data.name,
            email: data.email,
            cpfCnpj: data.cpfCnpj,
            mobilePhone: data.mobilePhone
          })
        } else {
          // Atualiza dados do cliente existente (Novo Negócio com mesmo CNPJ)
          customer = await AsaasService.updateCustomer(customer.id, {
            name: data.name,
            email: data.email,
            mobilePhone: data.mobilePhone
          })
        }

        // 2. Criar assinatura
        const subscription = await AsaasService.createSubscription(customer.id)

        // 3. Buscar os pagamentos gerados para obter o link de pagamento
        const payments = await AsaasService.getSubscriptionPayments(subscription.id)
        const pendingPayment = payments.find((p) => p.status === 'PENDING')

        return {
          success: true,
          customerId: customer.id,
          subscriptionId: subscription.id,
          invoiceUrl:
            pendingPayment?.invoiceUrl || subscription.invoiceUrl || subscription.checkoutUrl
        }
      } catch (err) {
        console.error('Erro Asaas Setup:', err)
        return { success: false, error: err instanceof Error ? err.message : String(err) }
      }
    }
  )

  ipcMain.handle('asaas:get-subscription-status', async (_, subscriptionId: string) => {
    try {
      const sub = await AsaasService.getSubscription(subscriptionId)

      // Se a assinatura estiver cancelada no Asaas (INACTIVE), retorna imediatamente
      // sem verificar pagamentos históricos para evitar falso-positivo de "ativo"
      if (sub.status === 'INACTIVE') {
        return {
          success: true,
          status: 'INACTIVE',
          value: sub.value,
          startDate: sub.startDate,
          nextDueDate: sub.nextDueDate,
          invoiceUrl: null,
          isPaid: false,
          isCancelled: true,
          paymentStatus: 'CANCELLED'
        }
      }

      const payments = await AsaasService.getSubscriptionPayments(subscriptionId)

      // Verificar se existe algum pagamento com status que libere o acesso
      // RECEIVED: Pagamento em conta
      // CONFIRMED: Pagamento confirmado (ex: cartão aprovação imediata)
      // RECEIVED_IN_CASH: Confirmado manualmente como pago em dinheiro
      const confirmedPayment = payments.find(
        (p) =>
          p.status === 'RECEIVED' || p.status === 'CONFIRMED' || p.status === 'RECEIVED_IN_CASH'
      )

      const pendingPayment = payments.find((p) => p.status === 'PENDING')

      return {
        success: true,
        status: sub.status,
        value: sub.value,
        startDate: sub.startDate,
        nextDueDate: sub.nextDueDate,
        invoiceUrl: pendingPayment?.invoiceUrl || sub.invoiceUrl || sub.checkoutUrl,
        isPaid: !!confirmedPayment,
        isCancelled: false,
        paymentStatus: confirmedPayment ? confirmedPayment.status : 'PENDING'
      }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('asaas:get-invoice-url', async (_, subscriptionId: string) => {
    try {
      const payments = await AsaasService.getSubscriptionPayments(subscriptionId)
      const pendingPayment = payments.find((p) => p.status === 'PENDING')
      const sub = await AsaasService.getSubscription(subscriptionId)
      const url = pendingPayment?.invoiceUrl || sub.invoiceUrl || sub.checkoutUrl || null
      return { success: true, invoiceUrl: url }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('asaas:cancel-subscription', async (_, subscriptionId: string) => {
    try {
      await AsaasService.cancelSubscription(subscriptionId)
      return { success: true }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  ipcMain.handle('asaas:check-customer', async (_, cpfCnpj: string) => {
    try {
      const customer = await AsaasService.findCustomerByCpfCnpj(cpfCnpj)
      if (customer) {
        return { success: true, exists: true, name: customer.name }
      }
      return { success: true, exists: false }
    } catch (err) {
      return { success: false, error: err instanceof Error ? err.message : String(err) }
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
  } else {
    mainWindow.loadFile(join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.electron')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

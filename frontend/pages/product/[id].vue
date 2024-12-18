<script setup>
const route = useRoute();
const userId = ref(null);
const productId = route.params.id;

const qrString = ref(null);
const currentQrData = ref(null);
const isQrPaid = ref(false);

const handleGetQrCode = async () => {
  const getQrBody = {
    userId: userId.value,
    productId: productId,
    amount: 10000,
    basket: [
      {
        reference_id: "prod-001",
        name: "Product 1",
        category: "Electronics",
        currency: "IDR",
        price: 10000,
        quantity: 1,
        type: "PRODUCT",
        url: "http://example.com/product-1",
        description: "Description of Product 1",
        sub_category: "Mobile Phone",
      },
    ],
    metadata: {
      description: `Purchase of product ${productId}`,
      category: "Electronics",
    },
  };

  try {
    const qr = await $fetch("http://localhost:4000/qr/get-qr", {
      method: "POST",
      body: getQrBody,
    });

    console.log(qr);

    currentQrData.value = qr.qrCode;
    qrString.value = qr.qrCode.qr_string;
    isQrPaid.value = qr.isPaid;
  } catch (err) {
    console.log(err.statusCode);
  }
};

const handlePay = async () => {
  try {
    const payResult = await $fetch(
      `https://api.xendit.co/qr_codes/${currentQrData.value.id}/payments/simulate`,
      {
        method: "POST",
        body: { amount: currentQrData.amount },
        headers: {
          "Content-Type": "application/json",
          "api-version": "2022-07-31",
          Authorization: `Basic ${btoa(
            "xnd_development_tmP7VtOVeK19xJI1P1ugOdTJvIqcmm3Pe0xMR8RMm4cr9VReTB2XrajGyEjfHCp"
          )}`,
        },
      }
    );

    console.log(payResult);
  } catch (err) {
    console.log(err);
  }
};

const handleCheckPayment = async () => {
  try {
    const checkPaymentResult = await $fetch(
      `http://localhost:4000/qr/check-qr-payment/${currentQrData.value.id}`,
      {
        method: "GET",
      }
    );

    console.log(checkPaymentResult);

    isQrPaid.value = checkPaymentResult.isPaid
  } catch (err) {
    console.log(err);
  }
};
</script>

<template>
  <UContainer class="flex justify-center items-center h-screen">
    <div class="w-96 h-96 flex justify-center">
      <div>
        <div>
          <div v-if="qrString">
            <Qrcode :value="qrString" />
            <UBadge color="green" v-if="isQrPaid">Paid</UBadge>
            <UBadge color="rose" v-else>Unpaid</UBadge>
          </div>
          <p v-else>Belum generate qr</p>
        </div>
        <div class="flex flex-col gap-4 w-full mt-4 justify-center">
          <div class="flex gap-2">
            <UButton @click="handleCheckPayment">Cek Pembayaran</UButton>
            <UButton @click="handlePay">Simulasi Bayar</UButton>
          </div>
          <div class="flex gap-2">
            <UInput v-model="userId" placeholder="Masukan user id"></UInput>
            <UButton @click="handleGetQrCode">Generate QR</UButton>
          </div>
        </div>
      </div>
    </div>
  </UContainer>
</template>

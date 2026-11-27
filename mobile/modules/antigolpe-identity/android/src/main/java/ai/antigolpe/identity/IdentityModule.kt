package ai.antigolpe.identity

import android.security.keystore.KeyGenParameterSpec
import android.security.keystore.KeyProperties
import android.util.Base64
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.security.KeyPairGenerator
import java.security.KeyStore
import java.security.MessageDigest
import java.security.PrivateKey
import java.security.Signature
import java.security.spec.ECGenParameterSpec
import java.util.UUID

class IdentityModule : Module() {
  private val alias = "antigolpe.assistant.v1"

  @Synchronized
  private fun keyStore(): KeyStore {
    val store = KeyStore.getInstance("AndroidKeyStore").apply { load(null) }
    if (!store.containsAlias(alias)) {
      val spec = KeyGenParameterSpec.Builder(alias, KeyProperties.PURPOSE_SIGN)
        .setAlgorithmParameterSpec(ECGenParameterSpec("secp256r1"))
        .setDigests(KeyProperties.DIGEST_SHA256)
        .build()
      KeyPairGenerator.getInstance(KeyProperties.KEY_ALGORITHM_EC, "AndroidKeyStore")
        .apply { initialize(spec) }.generateKeyPair()
    }
    return store
  }

  override fun definition() = ModuleDefinition {
    Name("AntiGolpeIdentity")
    AsyncFunction("identity") {
      val publicKey = keyStore().getCertificate(alias).publicKey.encoded
      val digest = MessageDigest.getInstance("SHA-256").digest(publicKey)
      mapOf("publicKey" to Base64.encodeToString(publicKey, Base64.NO_WRAP),
        "customerId" to "ag1_" + digest.joinToString("") { "%02x".format(it) })
    }
    AsyncFunction("signRequest") { body: String ->
      require(body.toByteArray().size <= 24000)
      val nonce = UUID.randomUUID().toString()
      val time = System.currentTimeMillis().toString()
      val signingInput = "antigolpe-assistant-v1\n$time\n$nonce\n$body"
      val signature = Signature.getInstance("SHA256withECDSA").apply {
        initSign(keyStore().getKey(alias, null) as PrivateKey)
        update(signingInput.toByteArray(Charsets.UTF_8))
      }.sign()
      mapOf("nonce" to nonce, "time" to time, "signature" to Base64.encodeToString(signature, Base64.NO_WRAP))
    }
  }
}

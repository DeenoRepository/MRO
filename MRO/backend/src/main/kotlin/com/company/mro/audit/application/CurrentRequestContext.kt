package com.company.mro.audit.application

object CurrentRequestContext {
    private val requestIdHolder = ThreadLocal<String?>()
    private val userAgentHolder = ThreadLocal<String?>()
    private val remoteAddressHolder = ThreadLocal<String?>()

    fun set(requestId: String?, userAgent: String?, remoteAddress: String?) {
        requestIdHolder.set(requestId)
        userAgentHolder.set(userAgent)
        remoteAddressHolder.set(remoteAddress)
    }

    fun clear() {
        requestIdHolder.remove()
        userAgentHolder.remove()
        remoteAddressHolder.remove()
    }

    fun requestId(): String? = requestIdHolder.get()
    fun userAgent(): String? = userAgentHolder.get()
    fun remoteAddress(): String? = remoteAddressHolder.get()
}


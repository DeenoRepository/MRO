package com.company.mro

import org.springframework.boot.autoconfigure.SpringBootApplication
import org.springframework.boot.runApplication

@SpringBootApplication
class MroApplication

fun main(args: Array<String>) {
    runApplication<MroApplication>(*args)
}


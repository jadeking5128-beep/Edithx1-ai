plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.compose.compiler)
}

val geminiKey = System.getenv("GEMINI_API_KEY") ?: ""
val geminiKey2 = System.getenv("GEMINI_API_KEY_2") ?: ""
val geminiKey3 = System.getenv("GEMINI_API_KEY_3") ?: ""
val geminiKey4 = System.getenv("GEMINI_API_KEY_4") ?: ""

android {
    namespace = "com.example.edith"
    compileSdk = 36

    defaultConfig {
        applicationId = "com.aistudio.edithx1.app"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "1.0"

        buildConfigField("String", "GEMINI_API_KEY", "\"$geminiKey\"")
        buildConfigField("String", "GEMINI_API_KEY_2", "\"$geminiKey2\"")
        buildConfigField("String", "GEMINI_API_KEY_3", "\"$geminiKey3\"")
        buildConfigField("String", "GEMINI_API_KEY_4", "\"$geminiKey4\"")
    }

    signingConfigs {
        create("release") {
            storeFile = file("${rootDir}/debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
        getByName("debug") {
            storeFile = file("${rootDir}/debug.keystore")
            storePassword = "android"
            keyAlias = "androiddebugkey"
            keyPassword = "android"
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            proguardFiles(
                getDefaultProguardFile("proguard-android-optimize.txt"),
                "proguard-rules.pro"
            )
            signingConfig = signingConfigs.getByName("release")
        }
        debug {
            signingConfig = signingConfigs.getByName("debug")
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_21
        targetCompatibility = JavaVersion.VERSION_21
    }

    buildFeatures {
        compose = true
        buildConfig = true
    }
}

dependencies {
    implementation(libs.androidx.core.ktx)
    implementation(libs.androidx.lifecycle.runtime.ktx)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.activity.compose)
    implementation(platform(libs.androidx.compose.bom))
    implementation(libs.androidx.compose.ui)
    implementation(libs.androidx.compose.ui.graphics)
    implementation(libs.androidx.compose.ui.tooling.preview)
    implementation(libs.androidx.compose.material3)
    implementation(libs.androidx.compose.material.icons.extended)
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.okhttp)
}

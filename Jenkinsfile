pipeline {
    agent any

    environment {
        
        DOCKER_HUB_USER = "brahmanya"
        BACKEND_IMAGE = "${DOCKER_HUB_USER}/backend-metrics"
        FRONTEND_IMAGE = "${DOCKER_HUB_USER}/frontend-metrics"
        
        
        GIT_REPO_URL = "https://github.com/brahmanyasudulagunta/Metrics.git"
        GIT_CREDENTIALS_ID = "github" // Credentials ID for GitHub Personnal Access Token
    }

    stages {
        stage('Checkout Code') {
            steps {
                checkout scm
            }
        }

        stage('Build & Push Backend') {
            steps {
                script {
                    
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub') {
                        def backend = docker.build("${BACKEND_IMAGE}:v1", "./backend")
                        backend.push()
                    }
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                script {
                    
                     docker.withRegistry('https://index.docker.io/v1/', 'dockerhub') {
                        def frontend = docker.build("${FRONTEND_IMAGE}:v1", "./frontend")
                        frontend.push()
                    }
                }
            }
        }

        stage('Helm Package') {
            steps {
                echo "Updating chart dependencies..."
                sh 'helm dependency update ./charts'
                
                echo "Packaging chart..."
                sh 'helm package ./charts'
                
                sh 'mv *.tgz /tmp/'
                sh 'git add .
            }
        }

        stage('Deploy to gh-pages (Helm Repo)') {
            steps {
                script {
                  
                    withCredentials([string(credentialsId: GIT_CREDENTIALS_ID, variable: 'GITHUB_TOKEN')]) {
                        sh 'git add .'
                        sh 'git fetch origin gh-pages'
                        sh 'git checkout gh-pages || git checkout -b gh-pages'
                        
                        sh 'mv /tmp/*.tgz .'
                        
                        // Update Helm repo index
                        sh 'helm repo index .'
                        
                        // Git configuration
                        sh 'git config user.email "jenkins-bot@metrics.local"'
                        sh 'git config user.name "Jenkins Automation"'
                        
                        // Commit and push updates
                        sh 'git add .'
                        sh 'git commit -m "Helm Release latest" || echo "No changes to commit"'
                        
                        // Push using the HTTPS token
                        def repoUrl = "https://${GITHUB_TOKEN}@github.com/brahmanyasudulagunta/Metrics.git"
                        sh "git push ${repoUrl} gh-pages"
                    }
                }
            }
        }
    }

    post {
        success {
            echo "Successfully built, pushed, and released Metrics Dashboard v1.0.0"
        }
    }
}

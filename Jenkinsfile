pipeline {
    agent any

    environment {
        // Docker configuration for 'brahmanya' account
        DOCKER_HUB_USER = "brahmanya"
        BACKEND_IMAGE = "${DOCKER_HUB_USER}/backend-metrics"
        FRONTEND_IMAGE = "${DOCKER_HUB_USER}/frontend-metrics"
        
        // Git configuration for Helm repository (gh-pages)
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
                    // Requires "Docker Pipeline" plugin and "docker-hub-creds" credentials
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub') {
                        def backend = docker.build("${BACKEND_IMAGE}:latest", "./backend")
                        backend.push()
                    }
                }
            }
        }

        stage('Build & Push Frontend') {
            steps {
                script {
                    docker.withRegistry('https://index.docker.io/v1/', 'dockerhub') {
                        def frontend = docker.build("${FRONTEND_IMAGE}:latest", "./frontend")
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
                
                // Temporarily stash the package outside the workspace to avoid losing it during checkout
                sh 'mv *.tgz /tmp/'
            }
        }

        stage('Deploy to gh-pages (Helm Repo)') {
            steps {
                script {
                    // Injecting the GitHub Token for authentication
                    withCredentials([string(credentialsId: GIT_CREDENTIALS_ID, variable: 'GITHUB_TOKEN')]) {
                        // Switch to gh-pages branch
                        sh 'git fetch origin gh-pages'
                        sh 'git checkout gh-pages || git checkout -b gh-pages'
                        
                        // Bring the package back into the gh-pages branch
                        sh 'mv /tmp/*.tgz .'
                        
                        // Update Helm repo index
                        sh 'helm repo index .'
                        
                        // Git configuration
                        sh 'git config user.email "jenkins-bot@metrics.local"'
                        sh 'git config user.name "Jenkins Automation"'
                        
                        // Commit and push updates
                        sh 'git add .'
                        sh 'git commit -m "chore: automated release to helm repository [skip ci]" || echo "No changes to commit"'
                        
                        // Push using the HTTPS token
                        def repoUrl = "https://${GITHUB_TOKEN}@github.com/brahmanyasudulagunta/Metrics.git"
                        sh "git push ${repoUrl} gh-pages"
                    }
                }
            }
        }
    }

    post {
        always {
            echo "Cleaning up..."
            sh 'rm -f /tmp/*.tgz'
        }
        success {
            echo "Successfully built, pushed, and released Metrics Dashboard v1.0.0"
        }
    }
}
